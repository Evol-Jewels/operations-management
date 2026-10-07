"use client";

import { useCallback, useEffect, useState } from "react";
import type { Repair } from "@/lib/repairs";
import { readRepairs, saveRepair } from "@/lib/repairsStorage";

export function useRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setError("");
    try {
      setRepairs(await readRepairs());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load repairs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const save = async (repair: Repair) => {
    await saveRepair(repair);
    setRepairs((records) => [
      repair,
      ...records.filter((record) => record.id !== repair.id),
    ]);
  };
  return { repairs, isLoading, error, reload, save };
}
