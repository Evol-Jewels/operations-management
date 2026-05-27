"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CALCULATOR_SETTINGS } from "@/lib/calculator/constants";
import type {
  CalculatorSettings,
  CalculatorStoneSlab,
  CalculatorStoneType,
  MetalPurity,
} from "@/types";

const SETTINGS_STORAGE_KEY = "diamond-calc-settings";
const LAST_SYNCED_STORAGE_KEY = "diamond-calc-last-synced";
const SYSTEM_SETTINGS_ENDPOINT = "/api/v1/system-settings";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
}

type SystemSettingsResponse = Partial<CalculatorSettings> & {
  purityPercentages?: Partial<Record<MetalPurity, number | null>>;
  stoneTypes?: Array<
    Partial<Omit<CalculatorStoneType, "slabs">> & {
      slabs?: Array<Partial<CalculatorStoneSlab> | null> | null;
    }
  >;
};

function toNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizePurityPercentages(
  value: unknown,
): CalculatorSettings["purityPercentages"] {
  const fallback = DEFAULT_CALCULATOR_SETTINGS.purityPercentages;
  if (!value || typeof value !== "object") return fallback;

  const partial = value as Partial<Record<MetalPurity, number | null>>;
  return {
    "14K": toNumber(partial["14K"], fallback["14K"]),
    "18K": toNumber(partial["18K"], fallback["18K"]),
    "22K": toNumber(partial["22K"], fallback["22K"]),
    "24K": toNumber(partial["24K"], fallback["24K"]),
    Other: toNumber(partial.Other, fallback.Other),
  };
}

function normalizeStoneTypes(value: unknown): CalculatorSettings["stoneTypes"] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_CALCULATOR_SETTINGS.stoneTypes;
  }

  const normalized = value
    .map((stone) => {
      if (!stone || typeof stone !== "object") return null;
      const candidate = stone as NonNullable<
        SystemSettingsResponse["stoneTypes"]
      >[number];
      const stoneId = candidate.stoneId?.trim();
      if (!stoneId) return null;

      const slabs = Array.isArray(candidate.slabs)
        ? candidate.slabs
            .filter((slab): slab is Partial<CalculatorStoneSlab> =>
              Boolean(slab),
            )
            .map((slab) => ({
              code: slab.code?.trim() ?? "",
              fromWeight: toNumber(slab.fromWeight, 0),
              toWeight: toNumber(slab.toWeight, 0),
              pricePerCarat: toNumber(slab.pricePerCarat, 0),
            }))
            .filter((slab) => slab.code.length > 0)
        : [];

      return {
        stoneId,
        name: candidate.name?.trim() || stoneId,
        category: candidate.category === "Gemstone" ? "Gemstone" : "Diamond",
        clarity: candidate.clarity?.trim() || undefined,
        color: candidate.color?.trim() || undefined,
        slabs,
      } satisfies CalculatorStoneType;
    })
    .filter((stone): stone is CalculatorStoneType => Boolean(stone));

  return normalized.length > 0
    ? normalized
    : DEFAULT_CALCULATOR_SETTINGS.stoneTypes;
}

function normalizeSystemSettings(
  raw: unknown,
  currentSettings: CalculatorSettings,
): CalculatorSettings {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid system settings response");
  }

  const response = raw as SystemSettingsResponse;
  return {
    goldRate24k: toNumber(
      response.goldRate24k,
      currentSettings.goldRate24k ?? DEFAULT_CALCULATOR_SETTINGS.goldRate24k,
    ),
    makingChargeFlat: toNumber(
      response.makingChargeFlat,
      currentSettings.makingChargeFlat ??
        DEFAULT_CALCULATOR_SETTINGS.makingChargeFlat,
    ),
    makingChargePerGram: toNumber(
      response.makingChargePerGram,
      currentSettings.makingChargePerGram ??
        DEFAULT_CALCULATOR_SETTINGS.makingChargePerGram,
    ),
    gstRate: toNumber(
      response.gstRate,
      currentSettings.gstRate ?? DEFAULT_CALCULATOR_SETTINGS.gstRate,
    ),
    purityPercentages: normalizePurityPercentages(
      response.purityPercentages ?? currentSettings.purityPercentages,
    ),
    stoneTypes: normalizeStoneTypes(response.stoneTypes),
  };
}

function isValidSettings(value: unknown): value is CalculatorSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as CalculatorSettings;
  return (
    typeof settings.goldRate24k === "number" &&
    typeof settings.makingChargeFlat === "number" &&
    typeof settings.makingChargePerGram === "number" &&
    typeof settings.gstRate === "number" &&
    typeof settings.purityPercentages === "object" &&
    Array.isArray(settings.stoneTypes)
  );
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
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Could not persist ${key} to localStorage`, error);
    }
    return false;
  }
}

function readStoredSettings() {
  try {
    const stored = readStorageValue(SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_CALCULATOR_SETTINGS;
    const parsed = JSON.parse(stored);
    return isValidSettings(parsed) ? parsed : DEFAULT_CALCULATOR_SETTINGS;
  } catch {
    return DEFAULT_CALCULATOR_SETTINGS;
  }
}

function assembleSettings(
  currentSettings: CalculatorSettings,
  nextSettings: CalculatorSettings,
): CalculatorSettings {
  return {
    ...currentSettings,
    ...nextSettings,
    purityPercentages:
      nextSettings.purityPercentages ?? currentSettings.purityPercentages,
    stoneTypes: nextSettings.stoneTypes.length
      ? nextSettings.stoneTypes
      : currentSettings.stoneTypes,
  };
}

export function useCalculatorSettings() {
  const [settings, setSettings] = useState<CalculatorSettings>(
    DEFAULT_CALCULATOR_SETTINGS,
  );
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasLoadedStoredSettings, setHasLoadedStoredSettings] = useState(false);

  useEffect(() => {
    setSettings(readStoredSettings());
    setLastSynced(readStorageValue(LAST_SYNCED_STORAGE_KEY));
    setHasLoadedStoredSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSettings) return;
    writeStorageValue(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [hasLoadedStoredSettings, settings]);

  const syncFromSheet = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_API_BASE_URL in .env");
      }

      const response = await fetch(
        new URL(SYSTEM_SETTINGS_ENDPOINT, `${apiBaseUrl}/`),
        {
          headers: { Accept: "application/json" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch system settings (HTTP ${response.status})`,
        );
      }

      const payload = (await response.json()) as unknown;

      const syncedAt = new Date().toISOString();
      setSettings((current) =>
        assembleSettings(current, normalizeSystemSettings(payload, current)),
      );
      setLastSynced(syncedAt);
      writeStorageValue(LAST_SYNCED_STORAGE_KEY, syncedAt);
      return { success: true, error: null };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sync settings";
      setSyncError(message);
      return { success: false, error: message };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const applySync = useCallback(
    (newSettings: CalculatorSettings, syncedAt: string) => {
      setSettings(newSettings);
      setLastSynced(syncedAt);
      writeStorageValue(LAST_SYNCED_STORAGE_KEY, syncedAt);
    },
    [],
  );

  return {
    settings,
    lastSynced,
    isSyncing,
    syncError,
    setSettings,
    syncFromSheet,
    applySync,
  };
}
