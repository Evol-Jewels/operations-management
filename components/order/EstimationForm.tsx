"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StoneTypeCombobox } from "@/components/stone-type-combobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOrdersStore } from "@/lib/stores/orders-store";
import { useStoneTypes } from "@/hooks/useManageProducts";
import { calculateEstimationAmount } from "@/lib/utils";
import type {
  MetalPurity,
  ProductEstimation,
  EstimationStoneDetail,
} from "@/types";

interface EstimationFormProps {
  orderId: string;
  productId: string;
  initialPurity: MetalPurity;
}

const METAL_PURITIES: MetalPurity[] = ["14K", "18K", "22K", "24K", "Other"];

const STONE_TYPES = [
  "Round",
  "Oval",
  "Cushion",
  "Emerald",
  "Kite",
  "Shield",
  "Heart",
  "Princess",
  "Pear",
  "Radiant",
] as const;

export function EstimationForm({
  orderId,
  productId,
  initialPurity,
}: EstimationFormProps) {
  const stoneTypesQuery = useStoneTypes({ limit: 1000 });
  const stoneTypeOptions = (stoneTypesQuery.data?.data ?? [])
    .filter((stone) => !stone.isDeleted)
    .map((stone) => ({ value: stone.name, label: stone.name }));
  const availableStoneTypes = stoneTypeOptions.length > 0
    ? stoneTypeOptions
    : STONE_TYPES.map((stone) => ({ value: stone, label: stone }));
  const [open, setOpen] = useState(false);
  const [metalWeight, setMetalWeight] = useState("");
  const [purity, setPurity] = useState<MetalPurity>(initialPurity);
  const [stoneDetails, setStoneDetails] = useState<EstimationStoneDetail[]>([]);
  const [finalAmount, setFinalAmount] = useState(0);
  const addProductEstimation = useOrdersStore(
    (state) => state.addProductEstimation,
  );

  useEffect(() => {
    if (metalWeight || stoneDetails.length > 0) {
      setFinalAmount(calculateEstimationAmount());
    }
  }, [metalWeight, stoneDetails]);

  function addStone() {
    setStoneDetails([
      ...stoneDetails,
      {
        id: `stone-${Date.now()}`,
        type: "",
        netWeight: 0,
        pieces: 0,
      },
    ]);
  }

  function updateStone(
    index: number,
    field: keyof EstimationStoneDetail,
    value: string | number,
  ) {
    const updated = [...stoneDetails];
    updated[index] = { ...updated[index], [field]: value };
    setStoneDetails(updated);
  }

  function removeStone(index: number) {
    setStoneDetails(stoneDetails.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!metalWeight) return;
    const estimation: ProductEstimation = {
      id: `est-${Date.now()}`,
      productId,
      metalWeight: parseFloat(metalWeight),
      purity,
      stoneDetails,
      finalAmount,
      createdAt: new Date().toISOString(),
    };
    addProductEstimation(orderId, estimation);
    setOpen(false);
    resetForm();
  }

  function resetForm() {
    setMetalWeight("");
    setPurity(initialPurity);
    setStoneDetails([]);
    setFinalAmount(0);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          Add Estimation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Product Estimation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          {/* Metal Weight */}
          <div className="space-y-2">
            <Label htmlFor="metal-weight">
              Metal Weight (g) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="metal-weight"
              type="number"
              value={metalWeight}
              onChange={(e) => setMetalWeight(e.target.value)}
              placeholder="Enter metal weight"
            />
          </div>

          {/* Purity */}
          <div className="space-y-2">
            <Label htmlFor="purity">
              Purity <span className="text-destructive">*</span>
            </Label>
            <Select
              value={purity}
              onValueChange={(v) => setPurity(v as MetalPurity)}
            >
              <SelectTrigger id="purity">
                <SelectValue placeholder="Select purity" />
              </SelectTrigger>
              <SelectContent>
                {METAL_PURITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stone Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Stone Details</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addStone}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Stone
              </Button>
            </div>
            {stoneDetails.map((stone, index) => (
              <div
                key={stone.id}
                className="space-y-2 p-3 border border-border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stone {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStone(index)}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <StoneTypeCombobox
                      options={availableStoneTypes}
                      value={stone.type || ""}
                      onValueChange={(value) => updateStone(index, "type", value)}
                      loading={stoneTypesQuery.isLoading}
                      placeholder="Select"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Net Weight (g)</Label>
                    <Input
                      type="number"
                      value={stone.netWeight || ""}
                      onChange={(e) =>
                        updateStone(
                          index,
                          "netWeight",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="0"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pieces</Label>
                    <Input
                      type="number"
                      value={stone.pieces || ""}
                      onChange={(e) =>
                        updateStone(
                          index,
                          "pieces",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      placeholder="0"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Amount */}
          <div className="space-y-2">
            <Label>Final Amount</Label>
            <div className="p-3 bg-muted rounded-lg text-lg font-semibold">
              ₹{finalAmount.toLocaleString()}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!metalWeight}>
            Save Estimation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
