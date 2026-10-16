import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ArrowRight, AlertTriangle, BombIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RivalSkill {
  skillId: string;
  skillName: string;
  currentValue: number;
}

interface SabotageRedistributeModalProps {
  open: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  skillTree: RivalSkill[];
  maxPoints: number;
  onSubmit: (redistribution: {
    decrements: { skillId: string; amount: number }[];
    increments: { skillId: string; amount: number }[];
  }) => void;
  isSubmitting: boolean;
}

export function SabotageRedistributeModal({
  open,
  onClose,
  targetName,
  skillTree,
  maxPoints,
  onSubmit,
  isSubmitting,
}: SabotageRedistributeModalProps) {
  const [changes, setChanges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      setChanges({});
    }
  }, [open, skillTree]);

  const currentValues = useMemo(() => {
    const values: Record<string, number> = {};
    skillTree.forEach((skill) => {
      values[skill.skillId] =
        skill.currentValue + (changes[skill.skillId] || 0);
    });
    return values;
  }, [skillTree, changes]);

  const totalDecremented = useMemo(() => {
    return Object.values(changes).reduce((sum, change) => {
      return sum + (change < 0 ? Math.abs(change) : 0);
    }, 0);
  }, [changes]);

  const totalIncremented = useMemo(() => {
    return Object.values(changes).reduce((sum, change) => {
      return sum + (change > 0 ? change : 0);
    }, 0);
  }, [changes]);

  const remainingPoints = maxPoints - totalDecremented;
  const unallocatedPoints = totalDecremented - totalIncremented;

  const canDecrement = (skillId: string) => {
    const currentValue = currentValues[skillId];
    return currentValue > 0 && totalDecremented < maxPoints;
  };

  const canIncrement = (skillId: string) => {
    const currentValue = currentValues[skillId];
    return currentValue < 8 && unallocatedPoints > 0;
  };

  const handleDecrement = (skillId: string) => {
    if (!canDecrement(skillId)) return;
    setChanges((prev) => ({
      ...prev,
      [skillId]: (prev[skillId] || 0) - 1,
    }));
  };

  const handleIncrement = (skillId: string) => {
    if (!canIncrement(skillId)) return;
    setChanges((prev) => ({
      ...prev,
      [skillId]: (prev[skillId] || 0) + 1,
    }));
  };

  const handleSubmit = () => {
    const decrements: { skillId: string; amount: number }[] = [];
    const increments: { skillId: string; amount: number }[] = [];

    Object.entries(changes).forEach(([skillId, change]) => {
      if (change < 0) {
        decrements.push({ skillId, amount: Math.abs(change) });
      } else if (change > 0) {
        increments.push({ skillId, amount: change });
      }
    });

    onSubmit({ decrements, increments });
  };

  const isValid =
    totalDecremented === maxPoints && totalIncremented === maxPoints;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <DialogContent
        showCloseButton={false}
        className="!sm:max-w-lg !bg-gradient-to-br !from-gray-900 !via-red-950/100 !to-gray-900 !border-red-500/50"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-red-400 !text-xl">
            <BombIcon className="!h-6 !w-6" />
            Sabotage - Redistribute Skills
          </DialogTitle>
          <DialogDescription className="!text-gray-300">
            Mess up{" "}
            <span className="!text-red-400 !font-semibold">{targetName}'s</span>{" "}
            skill build! Move up to {maxPoints} points between their skills.
          </DialogDescription>
        </DialogHeader>

        <div className="!flex !items-center !justify-between !p-3 !bg-gray-800/50 !rounded-lg !border !border-gray-700">
          <div className="!flex !items-center !gap-4">
            <div className="!text-center">
              <p className="!text-2xl !font-bold !text-red-400">
                {totalDecremented}
              </p>
              <p className="!text-xs !text-gray-400">Removed</p>
            </div>
            <ArrowRight className="!h-5 !w-5 !text-gray-500" />
            <div className="!text-center">
              <p className="!text-2xl !font-bold !text-green-400">
                {totalIncremented}
              </p>
              <p className="!text-xs !text-gray-400">Added</p>
            </div>
          </div>
          <div className="!text-center">
            <p className="!text-lg !font-semibold !text-yellow-400">
              {remainingPoints}
            </p>
            <p className="!text-xs !text-gray-400">Remaining</p>
          </div>
        </div>

        {unallocatedPoints > 0 && (
          <div className="!flex !items-center !gap-2 !p-2 !bg-yellow-900/30 !border !border-yellow-600/50 !rounded-lg !text-yellow-300 !text-sm">
            <AlertTriangle className="!h-4 !w-4 !flex-shrink-0" />
            <span>
              {unallocatedPoints} point{unallocatedPoints > 1 ? "s" : ""}{" "}
              removed but not yet added to another skill
            </span>
          </div>
        )}

        <div className="!flex-1 !flex !flex-col !gap-2 !min-h-0">
          {skillTree.map((skill) => {
            const change = changes[skill.skillId] || 0;
            const currentValue = currentValues[skill.skillId];
            const originalValue = skill.currentValue;

            return (
              <div
                key={skill.skillId}
                className={`!flex !items-center !justify-between !px-3 !py-2 !rounded-lg !border !transition-all ${
                  change < 0
                    ? "!bg-red-900/30 !border-red-500/50"
                    : change > 0
                      ? "!bg-green-900/30 !border-green-500/50"
                      : "!bg-gray-800/50 !border-gray-700"
                }`}
              >
                <div className="!flex-1 !min-w-0">
                  <p className="!font-medium !text-white !capitalize !text-sm !truncate">
                    {skill.skillName}
                  </p>
                  <div className="!flex !items-center !gap-1.5 !text-xs">
                    <span className="!text-gray-400">{originalValue}</span>
                    {change !== 0 && (
                      <>
                        <ArrowRight className="!h-3 !w-3 !text-gray-500" />
                        <span
                          className={
                            change < 0 ? "!text-red-400" : "!text-green-400"
                          }
                        >
                          {currentValue}
                        </span>
                        <span
                          className={`!text-xs ${
                            change < 0 ? "!text-red-400" : "!text-green-400"
                          }`}
                        >
                          ({change > 0 ? "+" : ""}
                          {change})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="!flex !items-center !gap-2 !flex-shrink-0">
                  <button
                    onClick={() => handleDecrement(skill.skillId)}
                    disabled={!canDecrement(skill.skillId) || isSubmitting}
                    className="!w-8 !h-8 !flex !items-center !justify-center !rounded-full !bg-red-600 hover:!bg-red-500 disabled:!bg-gray-700 disabled:!opacity-50 disabled:!cursor-not-allowed !transition-colors"
                  >
                    <Minus className="!h-4 !w-4 !text-white" />
                  </button>

                  <span className="!w-8 !text-center !text-lg !font-bold !text-white">
                    {currentValue}
                  </span>

                  <button
                    onClick={() => handleIncrement(skill.skillId)}
                    disabled={!canIncrement(skill.skillId) || isSubmitting}
                    className="!w-8 !h-8 !flex !items-center !justify-center !rounded-full !bg-green-600 hover:!bg-green-500 disabled:!bg-gray-700 disabled:!opacity-50 disabled:!cursor-not-allowed !transition-colors"
                  >
                    <Plus className="!h-4 !w-4 !text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="!flex !items-center !w-full !justify-end !gap-x-4 !mt-4 !pt-4 !border-t !border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="!border-gray-600 !bg-gray-700/40 !text-gray-200 hover:!bg-gray-700 hover:!text-white !transition-all !duration-200"
          >
            Cancel
          </Button>

          <div className="!flex !gap-2 !justify-between">
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={cn(
                "!text-white !transition-all",
                isValid && !isSubmitting
                  ? "!bg-green-600 hover:!bg-green-500"
                  : "!bg-gray-500 !cursor-not-allowed",
              )}
            >
              {isSubmitting ? "Sabotaging..." : "Confirm Sabotage"}
            </Button>
          </div>
        </div>

        <p className="!text-xs !text-gray-500 !text-center">
          Remove points with the red button, add them back with green. Total
          removed must equal total added.
        </p>
      </DialogContent>
    </Dialog>
  );
}
