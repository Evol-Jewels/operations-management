"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/lib/calculator/constants";
import {
  fetchStoneSlabs,
  fetchStoneTypes,
  type ListStoneSlabsQuery,
  type ListStoneTypesQuery,
} from "@/lib/manageProductsApi";
import { fetchGoldRate, fetchSystemConfigs } from "@/lib/systemConfigApi";
import type {
  CalculatorSettings,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
  SystemConfig,
} from "@/types";
import type {
  StoneSlabResponse,
  StoneTypeResponse,
} from "@/types/manage-products-api";

const SYSTEM_CONFIGS_STORAGE_KEY = "diamond-calc-system-configs-v1";
const STONE_TYPES_STORAGE_KEY = "diamond-calc-stone-types-v1";
const STONE_SLABS_STORAGE_KEY = "diamond-calc-stone-slabs-v1";
const LAST_SETTINGS_SYNCED_STORAGE_KEY = "diamond-calc-settings-last-synced-v1";
const LIST_QUERY = { limit: 1000, offset: 0 } satisfies ListStoneTypesQuery &
  ListStoneSlabsQuery;

interface ListCache<T> {
  data: T[];
  total: number;
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeGstRate(value: unknown, fallback: number) {
  const numericValue = toNumber(value, fallback);
  return numericValue > 1 ? numericValue / 100 : numericValue;
}

function readStorageValue(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Could not persist ${key} to localStorage`, error);
    }
  }
}

function parseStoredJson<T>(
  key: string,
  validate: (value: unknown) => value is T,
) {
  const storedValue = readStorageValue(key);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    return validate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isSystemConfigList(value: unknown): value is SystemConfig[] {
  return Array.isArray(value);
}

function isListCache<T>(value: unknown): value is ListCache<T> {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.data) && typeof record.total === "number";
}

function readCachedSystemConfigs() {
  if (typeof window === "undefined") return null;
  return parseStoredJson<SystemConfig[]>(
    SYSTEM_CONFIGS_STORAGE_KEY,
    isSystemConfigList,
  );
}

function readCachedStoneTypes() {
  if (typeof window === "undefined") return null;
  return parseStoredJson<ListCache<StoneTypeResponse>>(
    STONE_TYPES_STORAGE_KEY,
    isListCache,
  );
}

function readCachedStoneSlabs() {
  if (typeof window === "undefined") return null;
  return parseStoredJson<ListCache<StoneSlabResponse>>(
    STONE_SLABS_STORAGE_KEY,
    isListCache,
  );
}

function persistCalculatorCaches({
  systemConfigs,
  stoneTypes,
  stoneSlabs,
}: {
  systemConfigs: SystemConfig[];
  stoneTypes: ListCache<StoneTypeResponse>;
  stoneSlabs: ListCache<StoneSlabResponse>;
}) {
  writeStorageValue(SYSTEM_CONFIGS_STORAGE_KEY, JSON.stringify(systemConfigs));
  writeStorageValue(STONE_TYPES_STORAGE_KEY, JSON.stringify(stoneTypes));
  writeStorageValue(STONE_SLABS_STORAGE_KEY, JSON.stringify(stoneSlabs));
}

function getConfigValue(configs: SystemConfig[], key: string) {
  return configs.find((config) => config.key === key)?.value;
}

function mapSystemConfigs(configs: SystemConfig[]) {
  const defaults = DEFAULT_CALCULATOR_SETTINGS;

  return {
    makingChargeFlat: toNumber(
      getConfigValue(configs, "makingChargeFlat"),
      defaults.makingChargeFlat,
    ),
    makingChargePerGram: toNumber(
      getConfigValue(configs, "makingChargePerGram"),
      defaults.makingChargePerGram,
    ),
    gstRate: normalizeGstRate(
      getConfigValue(configs, "gstRate"),
      defaults.gstRate,
    ),
    purityPercentages: {
      ...defaults.purityPercentages,
      "24K": toNumber(
        getConfigValue(configs, "purity24K"),
        defaults.purityPercentages["24K"],
      ),
      "22K": toNumber(
        getConfigValue(configs, "purity22K"),
        defaults.purityPercentages["22K"],
      ),
      "18K": toNumber(
        getConfigValue(configs, "purity18K"),
        defaults.purityPercentages["18K"],
      ),
      "14K": toNumber(
        getConfigValue(configs, "purity14K"),
        defaults.purityPercentages["14K"],
      ),
      Other: toNumber(
        getConfigValue(configs, "purityOther"),
        defaults.purityPercentages.Other,
      ),
    } satisfies Record<MetalPurity, number>,
  };
}

function mapStoneSlab(slab: StoneSlabResponse): CalculatorStoneSlab {
  return {
    code: slab.code,
    fromWeight: toNumber(slab.rangeFrom, 0),
    toWeight: toNumber(slab.rangeTo, 0),
    pricePerCarat: toNumber(slab.pricePerCarat, 0),
  };
}

function mapStoneTypes(
  stoneTypes: StoneTypeResponse[],
  slabs: StoneSlabResponse[],
): CalculatorStoneType[] {
  const activeStoneTypes = stoneTypes.filter((stone) => !stone.isDeleted);
  if (activeStoneTypes.length === 0)
    return DEFAULT_CALCULATOR_SETTINGS.stoneTypes;

  const activeSlabs = slabs.filter((slab) => !slab.isDeleted);

  return activeStoneTypes.map((stone) => ({
    stoneId: stone.id,
    name: stone.name,
    category: "Diamond",
    slabs: activeSlabs
      .filter((slab) => slab.stoneTypeId === stone.id)
      .map(mapStoneSlab),
  }));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Could not sync settings";
}

export function useCalculatorSettings() {
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[] | null>(
    readCachedSystemConfigs,
  );
  const [stoneTypes, setStoneTypes] =
    useState<ListCache<StoneTypeResponse> | null>(readCachedStoneTypes);
  const [stoneSlabs, setStoneSlabs] =
    useState<ListCache<StoneSlabResponse> | null>(readCachedStoneSlabs);
  const [lastSynced, setLastSynced] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : readStorageValue(LAST_SETTINGS_SYNCED_STORAGE_KEY),
  );
  const [isLoadingCachedSettings, setIsLoadingCachedSettings] = useState(false);
  const [isSyncingSettings, setIsSyncingSettings] = useState(false);
  const [cacheError, setCacheError] = useState<Error | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const missingCacheLoadRef = useRef(false);

  const goldRateQuery = useQuery({
    queryKey: ["gold-rate"],
    queryFn: fetchGoldRate,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const missingSystemConfigs = systemConfigs === null;
    const missingStoneTypes = stoneTypes === null;
    const missingStoneSlabs = stoneSlabs === null;

    if (
      missingCacheLoadRef.current ||
      (!missingSystemConfigs && !missingStoneTypes && !missingStoneSlabs)
    ) {
      return;
    }

    missingCacheLoadRef.current = true;
    setIsLoadingCachedSettings(true);
    setCacheError(null);

    async function loadMissingCachedSettings() {
      try {
        const systemConfigsPromise = missingSystemConfigs
          ? fetchSystemConfigs()
          : Promise.resolve(systemConfigs);
        const stoneTypesPromise = missingStoneTypes
          ? fetchStoneTypes(LIST_QUERY)
          : Promise.resolve(stoneTypes);
        const stoneSlabsPromise = missingStoneSlabs
          ? fetchStoneSlabs(LIST_QUERY)
          : Promise.resolve(stoneSlabs);

        const [systemConfigsResult, stoneTypesResult, stoneSlabsResult] =
          await Promise.all([
            systemConfigsPromise,
            stoneTypesPromise,
            stoneSlabsPromise,
          ]);

        if (!systemConfigsResult || !stoneTypesResult || !stoneSlabsResult) {
          throw new Error("Could not load calculator settings");
        }

        setSystemConfigs(systemConfigsResult);
        setStoneTypes(stoneTypesResult);
        setStoneSlabs(stoneSlabsResult);
        persistCalculatorCaches({
          systemConfigs: systemConfigsResult,
          stoneTypes: stoneTypesResult,
          stoneSlabs: stoneSlabsResult,
        });
      } catch (error) {
        setCacheError(
          error instanceof Error ? error : new Error(getErrorMessage(error)),
        );
      } finally {
        setIsLoadingCachedSettings(false);
      }
    }

    void loadMissingCachedSettings();
  }, [stoneSlabs, stoneTypes, systemConfigs]);

  const settings = useMemo<CalculatorSettings>(() => {
    const configSettings = mapSystemConfigs(systemConfigs ?? []);
    const mappedStoneTypes = mapStoneTypes(
      stoneTypes?.data ?? [],
      stoneSlabs?.data ?? [],
    );
    const goldRate24k = toNumber(
      goldRateQuery.data?.goldRate24k,
      DEFAULT_CALCULATOR_SETTINGS.goldRate24k,
    );

    return {
      ...configSettings,
      goldRate24k,
      stoneTypes: mappedStoneTypes,
    };
  }, [goldRateQuery.data, stoneSlabs, stoneTypes, systemConfigs]);

  const syncSettings = useCallback(async () => {
    setSyncError(null);
    setIsSyncingSettings(true);

    try {
      const [nextSystemConfigs, nextStoneTypes, nextStoneSlabs] =
        await Promise.all([
          fetchSystemConfigs(),
          fetchStoneTypes(LIST_QUERY),
          fetchStoneSlabs(LIST_QUERY),
        ]);

      persistCalculatorCaches({
        systemConfigs: nextSystemConfigs,
        stoneTypes: nextStoneTypes,
        stoneSlabs: nextStoneSlabs,
      });

      setSystemConfigs(nextSystemConfigs);
      setStoneTypes(nextStoneTypes);
      setStoneSlabs(nextStoneSlabs);

      const syncedAt = new Date().toISOString();
      setLastSynced(syncedAt);
      writeStorageValue(LAST_SETTINGS_SYNCED_STORAGE_KEY, syncedAt);
      return { success: true, error: null };
    } catch (error) {
      const message = getErrorMessage(error);
      setSyncError(message);
      return { success: false, error: message };
    } finally {
      setIsSyncingSettings(false);
    }
  }, []);

  const queryError = goldRateQuery.error ?? cacheError;

  return {
    settings,
    lastSynced,
    isLoading: goldRateQuery.isLoading || isLoadingCachedSettings,
    isFetching: goldRateQuery.isFetching || isLoadingCachedSettings,
    error: queryError,
    isSyncingSettings,
    syncError,
    syncSettings,
  };
}
