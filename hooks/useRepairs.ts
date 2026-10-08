"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  Repair,
  RepairComment,
  RepairStage,
  RepairVendor,
} from "@/lib/repairs";
import {
  fetchRepair,
  fetchRepairs,
  postRepairComment,
  updateRepairStage,
  updateRepairVendor,
} from "@/lib/repairsApi";

export function useRepairs(id?: string) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setRepairs(id ? [await fetchRepair(id)] : await fetchRepairs());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load repairs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void reload();
  }, [reload]);
  const saved = (repair: Repair) => {
    setRepairs((records) => [
      repair,
      ...records.filter((record) => record.id !== repair.id),
    ]);
  };
  const saveStage = async (
    repairId: string,
    stage: RepairStage,
    vendor?: RepairVendor,
  ) => saved(await updateRepairStage(repairId, stage, vendor));
  const saveVendor = async (repairId: string, vendor: RepairVendor) =>
    saved(await updateRepairVendor(repairId, vendor));
  const saveComment = async (
    repairId: string,
    comment: Pick<RepairComment, "message" | "attachments">,
  ) => saved(await postRepairComment(repairId, comment));
  return {
    repairs,
    isLoading,
    error,
    reload,
    saveStage,
    saveVendor,
    saveComment,
  };
}
