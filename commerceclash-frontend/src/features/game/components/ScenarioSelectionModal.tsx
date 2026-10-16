import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Compass,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ScenarioCard {
  id: string;
  title: string;
  description: string;
  category: "market" | "crisis" | "opportunity" | "challenge";
}

interface ScenarioSelectionModalProps {
  open: boolean;
  onClose: () => void;
  scenarios: ScenarioCard[];
  onSelectScenario: (scenario: ScenarioCard) => void;
  isSelecting: boolean;
}

const categoryConfig = {
  market: {
    icon: TrendingUp,
    bgColor: "!from-emerald-900/80 !to-emerald-950/80",
    borderColor: "!border-emerald-500/50 hover:!border-emerald-400",
    iconBg: "!bg-emerald-800 group-hover:!bg-emerald-700",
    iconColor: "!text-emerald-300",
    badge: "!bg-emerald-500/20 !text-emerald-300",
  },
  crisis: {
    icon: AlertTriangle,
    bgColor: "!from-red-900/80 !to-red-950/80",
    borderColor: "!border-red-500/50 hover:!border-red-400",
    iconBg: "!bg-red-800 group-hover:!bg-red-700",
    iconColor: "!text-red-300",
    badge: "!bg-red-500/20 !text-red-300",
  },
  opportunity: {
    icon: Sparkles,
    bgColor: "!from-amber-900/80 !to-amber-950/80",
    borderColor: "!border-amber-500/50 hover:!border-amber-400",
    iconBg: "!bg-amber-800 group-hover:!bg-amber-700",
    iconColor: "!text-amber-300",
    badge: "!bg-amber-500/20 !text-amber-300",
  },
  challenge: {
    icon: Target,
    bgColor: "!from-purple-900/80 !to-purple-950/80",
    borderColor: "!border-purple-500/50 hover:!border-purple-400",
    iconBg: "!bg-purple-800 group-hover:!bg-purple-700",
    iconColor: "!text-purple-300",
    badge: "!bg-purple-500/20 !text-purple-300",
  },
};

export function ScenarioSelectionModal({
  open,
  onClose,
  scenarios,
  onSelectScenario,
  isSelecting,
}: ScenarioSelectionModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && !isSelecting && onClose()}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:!max-w-2xl !bg-gradient-to-br !from-slate-900 !via-cyan-950 !to-slate-900 !border-cyan-500/50"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-cyan-400 !text-xl">
            <Compass className="!h-7 !w-7" />
            Trailblazer - Choose Your Path
          </DialogTitle>
          <DialogDescription className="!text-gray-300 !text-base !text-left">
            As the Trailblazer, you decide the class scenario! Choose wisely -
            your selection will determine the challenge everyone faces.
          </DialogDescription>
        </DialogHeader>

        <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4 !mt-6">
          {scenarios.length === 0 ? (
            <p className="!col-span-2 !text-center !text-gray-400 !py-8">
              No scenarios available.
            </p>
          ) : (
            scenarios.map((scenario) => {
              const config = categoryConfig[scenario.category];
              const Icon = config.icon;

              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario)}
                  disabled={isSelecting}
                  className={`
                    !flex !flex-col !justify-between !p-5 !bg-gradient-to-br ${config.bgColor} 
                    !border-2 ${config.borderColor} !rounded-xl 
                    !transition-all !duration-300 
                    !disabled:opacity-50 !disabled:cursor-not-allowed 
                    !group hover:!scale-[1.02] hover:!shadow-lg hover:!shadow-cyan-500/20
                  `}
                >
                  <div className="!flex !items-start !gap-3 !mb-3">
                    <div
                      className={cn(
                        "!w-12 !h-12 !rounded-lg !flex !items-center !justify-center !transition-colors !shrink-0",
                        config.iconBg,
                      )}
                    >
                      <Icon className={cn("!h-6 !w-6", config.iconColor)} />
                    </div>

                    <div className="!flex-1 !text-left">
                      <span
                        className={cn(
                          "!inline-block !px-2 !py-0.5 !text-xs !font-medium !rounded-full !mb-1 !capitalize",
                          config.badge,
                        )}
                      >
                        {scenario.category}
                      </span>

                      <p className="!font-bold !text-white !text-lg !leading-tight group-hover:!text-cyan-200 !transition-colors">
                        {scenario.title}
                      </p>
                    </div>
                  </div>

                  <p className="!text-sm !text-gray-300 !text-left !leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="!mt-4 !pt-3 !border-t !border-white/10">
                    <span className="!text-xs !text-cyan-400 !font-medium group-hover:!text-cyan-300 !transition-colors">
                      Click to select this scenario →
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="!mt-6 !flex !justify-between !items-center">
          <p className="!text-xs !text-gray-500">
            This action cannot be undone. The entire class will play the
            scenario you choose.
          </p>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSelecting}
            className="!rounded-md !border-gray-600 !text-gray-200 hover:!text-white hover:!bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
