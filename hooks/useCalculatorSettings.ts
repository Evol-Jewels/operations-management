"use client";

import { useCallback, useMemo, useState } from "react";
import { useStoneSlabs, useStoneTypes } from "@/hooks/useManageProducts";
import { useSystemConfigs } from "@/hooks/useSystemConfigs";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/lib/calculator/constants";
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

const LAST_STONES_SYNCED_STORAGE_KEY = "diamond-calc-stones-last-synced";
const CALCULATOR_QUERY_STALE_TIME = 10 * 60 * 1000;
const LIST_QUERY = { limit: 1000, offset: 0 };

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

function getConfigValue(configs: SystemConfig[], key: string) {
  return configs.find((config) => config.key === key)?.value;
}

function mapSystemConfigs(configs: SystemConfig[]) {
  const defaults = DEFAULT_CALCULATOR_SETTINGS;

  return {
    goldRate24k: toNumber(
      getConfigValue(configs, "goldRate24k"),
      defaults.goldRate24k,
    ),
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
  return error instanceof Error ? error.message : "Could not sync stones";
}

export function useCalculatorSettings() {
  const systemConfigsQuery = useSystemConfigs(true, {
    staleTime: CALCULATOR_QUERY_STALE_TIME,
  });
  const stoneTypesQuery = useStoneTypes(LIST_QUERY, true, {
    staleTime: CALCULATOR_QUERY_STALE_TIME,
  });
  const stoneSlabsQuery = useStoneSlabs(LIST_QUERY, true, {
    staleTime: CALCULATOR_QUERY_STALE_TIME,
  });
  const [lastSynced, setLastSynced] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : readStorageValue(LAST_STONES_SYNCED_STORAGE_KEY),
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  const settings = useMemo<CalculatorSettings>(() => {
    const configSettings = mapSystemConfigs(systemConfigsQuery.data ?? []);
    const stoneTypes = mapStoneTypes(
      stoneTypesQuery.data?.data ?? [],
      stoneSlabsQuery.data?.data ?? [],
    );

    return {
      ...configSettings,
      stoneTypes,
    };
  }, [systemConfigsQuery.data, stoneSlabsQuery.data, stoneTypesQuery.data]);

  const syncStones = useCallback(async () => {
    setSyncError(null);

    const [stoneTypesResult, stoneSlabsResult] = await Promise.all([
      stoneTypesQuery.refetch(),
      stoneSlabsQuery.refetch(),
    ]);

    const error = stoneTypesResult.error ?? stoneSlabsResult.error;
    if (error) {
      const message = getErrorMessage(error);
      setSyncError(message);
      return { success: false, error: message };
    }

    const syncedAt = new Date().toISOString();
    setLastSynced(syncedAt);
    writeStorageValue(LAST_STONES_SYNCED_STORAGE_KEY, syncedAt);
    return { success: true, error: null };
  }, [stoneSlabsQuery, stoneTypesQuery]);

  const queryError =
    systemConfigsQuery.error ?? stoneTypesQuery.error ?? stoneSlabsQuery.error;

  return {
    settings,
    lastSynced,
    isLoading:
      systemConfigsQuery.isLoading ||
      stoneTypesQuery.isLoading ||
      stoneSlabsQuery.isLoading,
    isFetching:
      systemConfigsQuery.isFetching ||
      stoneTypesQuery.isFetching ||
      stoneSlabsQuery.isFetching,
    error: queryError,
    isSyncingStones:
      stoneTypesQuery.isRefetching || stoneSlabsQuery.isRefetching,
    syncError,
    syncStones,
  };
}
