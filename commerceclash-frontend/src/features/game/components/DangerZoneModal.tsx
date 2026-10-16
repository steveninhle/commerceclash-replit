import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Skull,
  Crosshair,
  ArrowRight,
  Minus,
  Plus,
  User,
  AlertTriangle,
} from "lucide-react";
import type {
  DangerZonePhaseData,
  SkillDeduction,
} from "../hooks/heroCard/types";
import { cn } from "@/lib/utils";

interface DangerZoneModalProps {
  open: boolean;
  onClose: () => void;
  data: DangerZonePhaseData | null;
  onSubmit: (
    targetStudentId: string,
    skillDeductions: SkillDeduction[],
  ) => void;
  isSubmitting: boolean;
}

export function DangerZoneModal({
  open,
  onClose,
  data,
  onSubmit,
  isSubmitting,
}: DangerZoneModalProps) {
  const [deductions, setDeductions] = useState<Record<string, number>>({});
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    setDeductions({});
    setSelectedTargetId(null);
  }, [open, data]);

  const pointsToRemove = data?.pointsToRemove ?? 0;
  const msToSteal = data?.msToSteal ?? 0;

  const totalDeducted = useMemo(
    () => Object.values(deductions).reduce((sum, amt) => sum + amt, 0),
    [deductions],
  );

  const handleAdjustDeduction = (
    skillId: string,
    delta: number,
    maxAvailable: number,
  ) => {
    setDeductions((prev) => {
      const current = prev[skillId] ?? 0;
      const next = current + delta;

      if (next < 0) return prev;
      if (next > maxAvailable) return prev;
      if (delta > 0 && totalDeducted >= pointsToRemove) return prev;

      const updated = { ...prev };

      if (next === 0) delete updated[skillId];
      else updated[skillId] = next;

      return updated;
    });
  };

  const handleConfirm = () => {
    if (!selectedTargetId || totalDeducted !== pointsToRemove) return;

    const skillDeductionsList: SkillDeduction[] = Object.entries(
      deductions,
    ).map(([skillId, amount]) => ({
      skillId,
      amount,
    }));

    onSubmit(selectedTargetId, skillDeductionsList);
  };

  if (!data) {
    if (!open) return null;
    return (
      <Dialog
        open={open}
        onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:!max-w-xl !bg-gradient-to-br !from-red-950 !via-zinc-950 !to-neutral-950 !border-red-600/50 !text-white !shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="!flex !items-center !gap-2 !text-red-400 !text-xl !font-bold">
              <Skull className="!h-6 !w-6 !text-red-500 !animate-pulse" />
              Danger Zone — High Stakes Gambit
            </DialogTitle>
            <DialogDescription className="!text-gray-300 !text-sm">
              Loading tactical sacrifice data...
            </DialogDescription>
          </DialogHeader>
          <div className="!flex !flex-col !items-center !justify-center !py-8 !space-y-3">
            <div className="!h-8 !w-8 !animate-spin !rounded-full !border-4 !border-red-500 !border-t-transparent" />
            <p className="!text-sm !text-gray-400">
              Loading skill points and rivals...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canSubmit =
    selectedTargetId !== null &&
    totalDeducted === pointsToRemove &&
    !isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:!max-w-xl !bg-gradient-to-br !from-red-950 !via-zinc-950 !to-neutral-950 !border-red-600/50 !text-white !shadow-2xl !max-h-[90vh] !overflow-y-auto !small-scroll"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-red-400 !text-xl !font-bold">
            <Skull className="!h-6 !w-6 !text-red-500 !animate-pulse" />
            Danger Zone — High Stakes Gambit
          </DialogTitle>

          <DialogDescription className="!text-gray-300 !text-sm">
            Permanently remove{" "}
            <span className="!font-bold !text-red-400">
              {pointsToRemove} of your own skill points
            </span>{" "}
            to steal{" "}
            <span className="!font-bold !text-emerald-400">
              +{msToSteal} Market Share
            </span>{" "}
            from a chosen rival.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 */}
        <div className="!space-y-2.5 !pt-1">
          <div className="!flex !items-center !justify-between">
            <span className="!text-xs !uppercase !tracking-wider !font-semibold !text-gray-400 !flex !items-center !gap-1.5">
              <span className="!flex !h-5 !w-5 !items-center !justify-center !rounded-full !bg-red-600/40 !text-[11px] !font-bold !text-red-300">
                1
              </span>
              Sacrifice Your Own Skill Points:
            </span>

            <span
              className={cn(
                "!text-xs !px-2.5 !py-0.5 !rounded-full !font-bold !font-mono !transition-colors",
                totalDeducted === pointsToRemove
                  ? "!bg-emerald-500/20 !text-emerald-300 !border !border-emerald-500/40"
                  : "!bg-red-500/20 !text-red-300 !border !border-red-500/40",
              )}
            >
              {totalDeducted} / {pointsToRemove} points selected
            </span>
          </div>

          <div className="!grid !grid-cols-1 !sm:grid-cols-2 !gap-2">
            {data.skillTree.map((skill) => {
              const currentSacrifice = deductions[skill.skillId] ?? 0;
              const remainingVal = skill.currentValue - currentSacrifice;

              const canAdd =
                totalDeducted < pointsToRemove &&
                skill.currentValue > currentSacrifice;

              const canSub = currentSacrifice > 0;

              return (
                <div
                  key={skill.skillId}
                  className={cn(
                    "!flex !items-center !justify-between !p-2.5 !rounded-lg !border !transition-all",
                    currentSacrifice > 0
                      ? "!bg-red-950/40 !border-red-500/60 !shadow-md !shadow-red-950/50"
                      : "!bg-zinc-900/60 !border-zinc-800",
                  )}
                >
                  <div>
                    <div className="!text-sm !font-semibold !capitalize !text-white">
                      {skill.skillName}
                    </div>

                    <div className="!text-xs !text-gray-400">
                      Level:{" "}
                      <span className="!font-medium !text-white">
                        {skill.currentValue}
                      </span>
                      {currentSacrifice > 0 && (
                        <span className="!text-red-400 !ml-1">
                          (-{currentSacrifice} → {remainingVal})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="!flex !items-center !gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleAdjustDeduction(
                          skill.skillId,
                          -1,
                          skill.currentValue,
                        )
                      }
                      disabled={isSubmitting || !canSub}
                      className="!h-7 !w-7 !rounded !bg-zinc-800 !border !border-zinc-700 !flex !items-center !justify-center !text-gray-300 hover:!bg-zinc-700 disabled:!opacity-30 disabled:!cursor-not-allowed"
                    >
                      <Minus className="!h-3.5 !w-3.5" />
                    </button>

                    <span className="!w-5 !text-center !font-bold !font-mono !text-sm !text-red-300">
                      {currentSacrifice}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleAdjustDeduction(
                          skill.skillId,
                          1,
                          skill.currentValue,
                        )
                      }
                      disabled={isSubmitting || !canAdd}
                      className="!h-7 !w-7 !rounded !bg-red-900/60 !border !border-red-700 !flex !items-center !justify-center !text-red-200 hover:!bg-red-800 disabled:!opacity-30 disabled:!cursor-not-allowed"
                    >
                      <Plus className="!h-3.5 !w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2 */}
        <div className="!space-y-2.5 !pt-2">
          <div className="!flex !items-center !justify-between">
            <span className="!text-xs !uppercase !tracking-wider !font-semibold !text-gray-400 !flex !items-center !gap-1.5">
              <span className="!flex !h-5 !w-5 !items-center !justify-center !rounded-full !bg-red-600/40 !text-[11px] !font-bold !text-red-300">
                2
              </span>
              Target a Rival to Steal {msToSteal} MS:
            </span>
          </div>

          <div className="!max-h-40 !overflow-y-auto !space-y-1.5 !pr-1 !small-scroll">
            {data.rivals.length === 0 ? (
              <p className="!text-xs !text-gray-400 !text-center !py-3">
                No rivals available in class.
              </p>
            ) : (
              data.rivals.map((rival) => {
                const isSelected = selectedTargetId === rival.id;

                return (
                  <button
                    key={rival.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedTargetId(rival.id)}
                    className={cn(
                      "!w-full !flex !items-center !justify-between !p-2.5 !rounded-lg !border !text-left !transition-all",
                      isSelected
                        ? "!bg-red-600/20 !border-red-500 !text-white !ring-1 !ring-red-500 !shadow-lg !shadow-red-950/50"
                        : "!bg-zinc-900/50 !border-zinc-800 !text-gray-300 hover:!bg-zinc-800/60 hover:!border-zinc-700",
                    )}
                  >
                    <div className="!flex !items-center !gap-2.5">
                      <div
                        className={cn(
                          "!w-7 !h-7 !rounded-full !flex !items-center !justify-center !text-xs",
                          isSelected
                            ? "!bg-red-600 !text-white"
                            : "!bg-zinc-800 !text-gray-400",
                        )}
                      >
                        <User className="!h-3.5 !w-3.5" />
                      </div>

                      <div>
                        <div className="!font-semibold !text-sm !leading-tight">
                          {rival.name}
                        </div>

                        <div className="!text-xs !text-gray-400">
                          {rival.ceo?.title ? `${rival.ceo.title} • ` : ""}
                          MS:{" "}
                          <span className="!text-amber-300 !font-medium">
                            {rival.marketShare}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="!text-xs !bg-red-600/30 !text-red-300 !px-2 !py-0.5 !rounded !font-semibold !flex !items-center !gap-1">
                        <Crosshair className="!h-3 !w-3" />
                        Target
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="!flex !items-center !gap-2 !p-2.5 !bg-red-950/30 !border !border-red-800/40 !rounded-lg !text-xs !text-red-200">
          <AlertTriangle className="!h-4 !w-4 !text-red-400 !shrink-0" />

          <span>
            One-time use only. The {pointsToRemove} sacrificed skill points
            cannot be recovered.
          </span>
        </div>

        {/* Buttons */}
        <div className="!flex !gap-2.5 !pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="!flex-1 !border-zinc-600 !bg-zinc-800 !text-zinc-200 hover:!border-zinc-500 hover:!bg-zinc-700 hover:!text-white"
          >
            {" "}
            Cancel{" "}
          </Button>{" "}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="!flex-1 !bg-red-600 !text-white !font-bold !shadow-lg !shadow-red-900/30 hover:!bg-red-500 disabled:!bg-zinc-700 disabled:!text-zinc-500 disabled:!shadow-none"
          >
            {" "}
            {isSubmitting ? (
              "Executing Danger Zone..."
            ) : (
              <span className="!flex !items-center !justify-center !gap-1.5">
                {" "}
                Steal {msToSteal} MS <ArrowRight className="!h-4 !w-4" />{" "}
              </span>
            )}{" "}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
