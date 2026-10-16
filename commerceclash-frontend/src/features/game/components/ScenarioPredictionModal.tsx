import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Trophy,
} from "lucide-react";
import type { ScenarioType } from "../hooks/heroCard/types";
import { cn } from "@/lib/utils";

interface ScenarioPredictionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (predictedType: ScenarioType) => void;
  isSubmitting: boolean;
}

const SCENARIO_OPTIONS: {
  type: ScenarioType;
  title: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
  borderColor: string;
}[] = [
  {
    type: "market",
    title: "Market Shift",
    description:
      "Consumer behavior shifts and economic market trends dominate this round.",
    icon: TrendingUp,
    color: "!from-blue-600/30 !to-cyan-500/10 !text-cyan-300",
    borderColor: "!border-cyan-500/40 hover:!border-cyan-400",
  },
  {
    type: "crisis",
    title: "Corporate Crisis",
    description:
      "Unexpected operational disruptions or supply chain bottlenecks arise.",
    icon: AlertTriangle,
    color: "!from-red-600/30 !to-amber-500/10 !text-rose-300",
    borderColor: "!border-red-500/40 hover:!border-red-400",
  },
  {
    type: "opportunity",
    title: "Breakthrough Opportunity",
    description: "New venture frontiers open with high reward potential.",
    icon: Lightbulb,
    color: "!from-emerald-600/30 !to-teal-500/10 !text-emerald-300",
    borderColor: "!border-emerald-500/40 hover:!border-emerald-400",
  },
  {
    type: "challenge",
    title: "Rival Challenge",
    description:
      "Direct industry clash demanding decisive competitive advantage.",
    icon: Trophy,
    color: "!from-purple-600/30 !to-indigo-500/10 !text-purple-300",
    borderColor: "!border-purple-500/40 hover:!border-purple-400",
  },
];

export function ScenarioPredictionModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: ScenarioPredictionModalProps) {
  const [selectedType, setSelectedType] = useState<ScenarioType | null>(null);

  useEffect(() => { setSelectedType(null); }, [open]);

  const handleConfirm = () => {
    if (!selectedType) return;
    onSubmit(selectedType);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!bg-gradient-to-br !from-indigo-950 !via-slate-950 !to-neutral-950 !border-purple-500/50 !text-white !shadow-2xl sm:!max-w-lg !max-h-[90vh] !overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-purple-300 !text-xl !font-bold">
            <Sparkles className="!h-6 !w-6 !text-purple-400 !animate-pulse" />
            Prophecy — Divine the Scenario
          </DialogTitle>

          <DialogDescription className="!text-gray-300 !text-sm">
            Predict the upcoming scenario type. If your prophecy is correct, you
            will automatically gain{" "}
            <span className="!font-bold !text-amber-300">+1 Skill Point</span>.
          </DialogDescription>
        </DialogHeader>

        {/* 4 Cards Selector */}
        <div className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-2.5 !pt-2">
          {SCENARIO_OPTIONS.map(
            ({ type, title, description, icon: Icon, color, borderColor }) => {
              const isSelected = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "!flex !flex-col !text-left !p-3 !rounded-xl !border !transition-all !relative !overflow-hidden",
                    color,
                    borderColor,
                    isSelected
                      ? "!ring-2 !ring-purple-400 !shadow-lg !shadow-purple-500/30 !scale-[1.02]"
                      : "!opacity-80 hover:!opacity-100",
                  )}
                >
                  <div className="!flex !items-center !gap-2 !mb-1">
                    <Icon className="!h-4 !w-4 !shrink-0" />

                    <span className="!font-bold !text-sm !text-white">
                      {title}
                    </span>
                  </div>

                  <p className="!text-xs !text-gray-400 !line-clamp-2 !leading-relaxed">
                    {description}
                  </p>

                  {isSelected && (
                    <span className="!absolute !top-2 !right-2 !text-[10px] !uppercase !font-bold !tracking-wider !px-1.5 !py-0.5 !rounded !bg-purple-500/40 !text-purple-200">
                      Selected
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>

        {/* Action Buttons */}
        <div className="!flex !gap-2.5 !pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="!flex-1 !border-gray-700 !text-gray-300 hover:!bg-gray-800 hover:!text-white"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedType || isSubmitting}
            className="!flex-1 !bg-gradient-to-r !from-purple-600 !to-indigo-600 hover:!from-purple-500 hover:!to-indigo-500 !text-white !font-bold !shadow-lg !shadow-purple-600/30"
          >
            {isSubmitting ? "Locking in Prophecy..." : "Confirm Prediction"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
