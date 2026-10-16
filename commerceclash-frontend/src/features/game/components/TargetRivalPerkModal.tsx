import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Crosshair, ArrowRight } from "lucide-react";
import { CharacterName, studentCeoAssets } from "@/utils/helper";
import { cn } from "@/lib/utils";

interface TargetRival {
  id: string;
  name: string;
  marketShare?: number;
  skillPoints?: number;
  ceo?: { title: string };
}

interface TargetRivalPerkModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  rivals: TargetRival[];
  onSelectTarget: (targetId: string) => void;
  isSelecting: boolean;
  actionText?: string;
  themeColor?: "amber" | "purple" | "red" | "emerald";
}

export function TargetRivalPerkModal({
  open,
  onClose,
  title,
  description,
  rivals,
  onSelectTarget,
  isSelecting,
  actionText = "Select Target",
  themeColor = "amber",
}: TargetRivalPerkModalProps) {
  const colorThemes = {
    amber: {
      dialog:
        "!from-amber-950 !via-zinc-950 !to-neutral-950 !border-amber-500/50",
      title: "!text-amber-300",
      targetBtn:
        "hover:!bg-amber-600/20 hover:!border-amber-500",
      badge: "!bg-amber-500/20 !text-amber-300",
      icon: "!text-amber-400",
    },
    purple: {
      dialog:
        "!from-purple-950 !via-zinc-950 !to-neutral-950 !border-purple-500/50",
      title: "!text-purple-300",
      targetBtn:
        "hover:!bg-purple-600/20 hover:!border-purple-500",
      badge: "!bg-purple-500/20 !text-purple-300",
      icon: "!text-purple-400",
    },
    red: {
      dialog: "!from-red-950 !via-zinc-950 !to-neutral-950 !border-red-500/50",
      title: "!text-red-300",
      targetBtn:
        "hover:!bg-red-600/20 hover:!border-red-500",
      badge: "!bg-red-500/20 !text-red-300",
      icon: "!text-red-400",
    },
    emerald: {
      dialog:
        "!from-emerald-950 !via-zinc-950 !to-neutral-950 !border-emerald-500/50",
      title: "!text-emerald-300",
      targetBtn:
        "hover:!bg-emerald-600/20 hover:!border-emerald-500",
      badge: "!bg-emerald-500/20 !text-emerald-300",
      icon: "!text-emerald-400",
    },
  };

  const currentTheme = colorThemes[themeColor] || colorThemes.amber;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isSelecting && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "!bg-gradient-to-br sm:!max-w-md !text-white !shadow-2xl !max-h-[90vh] !overflow-y-auto",
          currentTheme.dialog,
        )}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              "!flex !items-center !gap-2 !text-xl !font-bold",
              currentTheme.title,
            )}
          >
            <Crosshair
              className={cn("!h-6 !w-6 !animate-pulse", currentTheme.icon)}
            />
            {title}
          </DialogTitle>

          <DialogDescription className="!text-gray-300 !text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="!space-y-2 !mt-2">
          {rivals.length === 0 ? (
            <div className="!flex !flex-col !items-center !justify-center !py-8 !space-y-3">
              <p className="!text-center !text-gray-400 !text-sm">
                No eligible rivals available.
              </p>
            </div>
          ) : (
            <div className="!max-h-80 !overflow-y-auto !space-y-2 !pr-1 small-scroll">
              {rivals.map((rival) => {
                const ceoAssets = rival.ceo?.title
                  ? studentCeoAssets(rival.ceo.title as CharacterName)
                  : null;

                return (
                  <button
                    key={rival.id}
                    type="button"
                    disabled={isSelecting}
                    onClick={() => onSelectTarget(rival.id)}
                    className={cn(
                      "!w-full !flex !items-center !justify-between !p-3 !rounded-xl !border !border-gray-800 !bg-gray-900/60 hover:!bg-gray-800/80 !transition-all !text-left group disabled:!opacity-50 disabled:!cursor-not-allowed",
                      currentTheme.targetBtn,
                    )}
                  >
                    <div className="!flex !items-center !gap-3">
                      {ceoAssets?.imageSrc ? (
                        <img
                          src={ceoAssets.imageSrc}
                          alt={rival.name}
                          className="!w-10 !h-10 !rounded-full !border !border-gray-700 !object-cover"
                        />
                      ) : (
                        <div className="!w-10 !h-10 !rounded-full !bg-gray-800 !flex !items-center !justify-center !text-gray-400">
                          <User className="!h-5 !w-5" />
                        </div>
                      )}

                      <div>
                        <div className="!font-bold !text-white !text-sm group-hover:!text-amber-200 !transition-colors">
                          {rival.name}
                        </div>

                        <div className="!text-xs !text-gray-400 !flex !items-center !gap-2">
                          {rival.ceo?.title && (
                            <span className="!text-gray-300 !font-medium">
                              {rival.ceo.title}
                            </span>
                          )}

                          {rival.marketShare !== undefined && (
                            <span>
                              MS:{" "}
                              <span className="!text-amber-300 !font-semibold">
                                {rival.marketShare}%
                              </span>
                            </span>
                          )}

                          {rival.skillPoints !== undefined && (
                            <span>
                              Skills:{" "}
                              <span className="!text-purple-300 !font-semibold">
                                {rival.skillPoints} pts
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="!flex !items-center !gap-1.5 !text-xs !font-semibold !text-gray-300 group-hover:!text-white !transition-colors">
                      <span>{actionText}</span>

                      <ArrowRight className="!h-3.5 !w-3.5 group-hover:!translate-x-0.5 !transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="!flex !justify-end !pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSelecting}
            className="!w-full !border-gray-700 !text-gray-300 hover:!bg-gray-800 hover:!text-white"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
