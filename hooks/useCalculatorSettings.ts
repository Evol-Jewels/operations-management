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
const FALLBACK_SHEET_ID = "1KWHxzODjoqEDYpXz6FqhPzggpM2YvsRLVwgwQ-Yfgv0";

function getSheetId() {
  return process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || FALLBACK_SHEET_ID;
}

function getSheetTabCsvUrl(sheetId: string, tabName: string) {
  const encodedQuery = encodeURIComponent("select *");
  const encodedSheet = encodeURIComponent(tabName);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}&tq=${encodedQuery}`;
}

function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    const nextChar = raw[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  return rows;
}

function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.toLowerCase().trim());
  return rows.slice(1).map((row) => {
    const item: Record<string, string> = {};
    headers.forEach((header, index) => {
      item[header] = row[index] ?? "";
    });
    return item;
  });
}

function toPurityKey(raw: string): MetalPurity | null {
  const normalized = raw.trim().toUpperCase();
  if (normalized === "14" || normalized === "14K") return "14K";
  if (normalized === "18" || normalized === "18K") return "18K";
  if (normalized === "22" || normalized === "22K") return "22K";
  if (normalized === "24" || normalized === "24K") return "24K";
  if (normalized === "OTHER") return "Other";
  return null;
}

function parseRatesTab(
  rows: Record<string, string>[],
): Partial<CalculatorSettings> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.key && row.value !== undefined) {
      map[row.key.trim()] = row.value.trim();
    }
  }

  const partial: Partial<CalculatorSettings> = {};
  if (map.goldRate24k !== undefined)
    partial.goldRate24k = Number(map.goldRate24k);
  if (map.makingChargeFlat !== undefined) {
    partial.makingChargeFlat = Number(map.makingChargeFlat);
  }
  if (map.makingChargePerGram !== undefined) {
    partial.makingChargePerGram = Number(map.makingChargePerGram);
  }
  if (map.gstRate !== undefined) partial.gstRate = Number(map.gstRate);

  const purityPercentages = {
    ...DEFAULT_CALCULATOR_SETTINGS.purityPercentages,
  };
  let hasPurity = false;

  for (const [key, value] of Object.entries(map)) {
    const match = key.match(/^purity_(.+)$/);
    if (!match) continue;

    const purity = toPurityKey(match[1]);
    if (!purity) continue;

    purityPercentages[purity] = Number(value);
    hasPurity = true;
  }

  if (hasPurity) partial.purityPercentages = purityPercentages;
  return partial;
}

function parseStonesTab(
  rows: Record<string, string>[],
): Omit<CalculatorStoneType, "slabs">[] {
  return rows
    .filter((row) => row.stoneid)
    .map((row) => ({
      stoneId: row.stoneid.trim(),
      name: row.name?.trim() || row.stoneid.trim(),
      category: row.type?.trim() === "Gemstone" ? "Gemstone" : "Diamond",
    }));
}

function parseSlabsTab(
  rows: Record<string, string>[],
): Record<string, CalculatorStoneSlab[]> {
  const slabsByStone: Record<string, CalculatorStoneSlab[]> = {};

  for (const row of rows) {
    const stoneId = row.stoneid?.trim();
    if (!stoneId) continue;

    const slab: CalculatorStoneSlab = {
      code: row.code?.trim() ?? "",
      fromWeight: Number(row.fromweight ?? 0),
      toWeight: Number(row.toweight ?? 0),
      pricePerCarat: Number(row.pricepercarat ?? 0),
    };

    if (!slabsByStone[stoneId]) slabsByStone[stoneId] = [];
    slabsByStone[stoneId].push(slab);
  }

  return slabsByStone;
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

function readStoredSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_CALCULATOR_SETTINGS;
    const parsed = JSON.parse(stored);
    return isValidSettings(parsed) ? parsed : DEFAULT_CALCULATOR_SETTINGS;
  } catch {
    return DEFAULT_CALCULATOR_SETTINGS;
  }
}

function assembleSettings(
  currentSettings: CalculatorSettings,
  ratesPart: Partial<CalculatorSettings>,
  stoneRows: Omit<CalculatorStoneType, "slabs">[],
  slabsByStone: Record<string, CalculatorStoneSlab[]>,
): CalculatorSettings {
  const stoneTypes = stoneRows.map((stone) => ({
    ...stone,
    slabs: slabsByStone[stone.stoneId] ?? [],
  }));

  return {
    ...currentSettings,
    ...ratesPart,
    stoneTypes: stoneTypes.length > 0 ? stoneTypes : currentSettings.stoneTypes,
  };
}

export function useCalculatorSettings() {
  const [settings, setSettings] = useState<CalculatorSettings>(
    DEFAULT_CALCULATOR_SETTINGS,
  );
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(readStoredSettings());
    setLastSynced(localStorage.getItem(LAST_SYNCED_STORAGE_KEY));
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const syncFromSheet = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const sheetId = getSheetId();
      const [ratesRes, stonesRes, slabsRes] = await Promise.all([
        fetch(getSheetTabCsvUrl(sheetId, "rates")),
        fetch(getSheetTabCsvUrl(sheetId, "stones")),
        fetch(getSheetTabCsvUrl(sheetId, "slabs")),
      ]);

      if (!ratesRes.ok) {
        throw new Error(`Failed to fetch rates tab (HTTP ${ratesRes.status})`);
      }
      if (!stonesRes.ok) {
        throw new Error(
          `Failed to fetch stones tab (HTTP ${stonesRes.status})`,
        );
      }
      if (!slabsRes.ok) {
        throw new Error(`Failed to fetch slabs tab (HTTP ${slabsRes.status})`);
      }

      const [ratesText, stonesText, slabsText] = await Promise.all([
        ratesRes.text(),
        stonesRes.text(),
        slabsRes.text(),
      ]);

      const ratesPart = parseRatesTab(csvToObjects(parseCsv(ratesText)));
      const stoneRows = parseStonesTab(csvToObjects(parseCsv(stonesText)));
      const slabsByStone = parseSlabsTab(csvToObjects(parseCsv(slabsText)));

      const syncedAt = new Date().toISOString();
      setSettings((current) =>
        assembleSettings(current, ratesPart, stoneRows, slabsByStone),
      );
      setLastSynced(syncedAt);
      localStorage.setItem(LAST_SYNCED_STORAGE_KEY, syncedAt);
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

  return {
    settings,
    lastSynced,
    isSyncing,
    syncError,
    setSettings,
    syncFromSheet,
  };
}
