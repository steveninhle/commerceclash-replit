import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, User, Sparkles } from "lucide-react";

interface TrendsetterRival {
  id: string;
  name: string;
  marketShare: number;
}

interface TrendsetterModalProps {
  open: boolean;
  onClose: () => void;
  rivals: TrendsetterRival[];
  onSelectTarget: (targetId: string) => void;
  isSelecting: boolean;
  diplomatGained?: number;
  newDiplomatMS?: number;
}

export function TrendsetterModal({
  open,
  onClose,
  rivals,
  onSelectTarget,
  isSelecting,
  diplomatGained = 1,
  newDiplomatMS,
}: TrendsetterModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!sm:max-w-md !bg-gradient-to-br !from-purple-900 !via-indigo-950 !to-purple-950 !border-purple-500/50"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-purple-300">
            <Sparkles className="!h-6 !w-6" />
            Trendsetter - Choose Your Victim
          </DialogTitle>
          <DialogDescription className="!text-gray-300">
            You've already gained{" "}
            <span className="!text-green-400 !font-bold">
              +{diplomatGained} MS
            </span>
            {newDiplomatMS !== undefined && (
              <span className="!text-gray-400"> (now at {newDiplomatMS})</span>
            )}
            . Now select a rival to lose{" "}
            <span className="!text-red-400 !font-bold">-1 MS</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Success Banner */}
        <div className="!flex !items-center !gap-3 !p-3 !bg-green-900/30 !border !border-green-500/50 !rounded-lg">
          <TrendingUp className="!h-5 !w-5 !text-green-400" />
          <span className="!text-green-300 !font-medium">
            You gained +{diplomatGained} Market Share!
          </span>
        </div>

        <div className="!space-y-3 !mt-1">
          <p className="!text-sm !text-gray-400 !flex !items-center !gap-2">
            <TrendingDown className="!h-4 !w-4 !text-red-400" />
            Select who loses -1 MS:
          </p>

          {rivals.length === 0 ? (
            <p className="!text-center !text-gray-400 !py-4">
              No rivals available.
            </p>
          ) : (
            <div className="!max-h-[246px] !overflow-y-auto !space-y-2 !small-scroll">
              {rivals.map((rival) => (
                <button
                  key={rival.id}
                  onClick={() => onSelectTarget(rival.id)}
                  disabled={isSelecting || rival.marketShare <= 0}
                  className={`!w-full !flex !items-center !gap-3 !p-4 !border !rounded-lg !transition-all !group ${
                    rival.marketShare <= 0
                      ? "!bg-gray-800/30 !border-gray-700 !opacity-50 !cursor-not-allowed"
                      : "!bg-gray-800/50 hover:!bg-purple-900/50 !border-gray-700 hover:!border-purple-500/50"
                  } disabled:!opacity-50 disabled:!cursor-not-allowed`}
                >
                  <div
                    className={`!w-10 !h-10 !rounded-full !flex !items-center !justify-center !transition-colors ${
                      rival.marketShare <= 0
                        ? "!bg-gray-700"
                        : "!bg-gray-700 group-hover:!bg-purple-800"
                    }`}
                  >
                    <User
                      className={`!h-5 !w-5 ${
                        rival.marketShare <= 0
                          ? "!text-gray-500"
                          : "!text-gray-300 group-hover:!text-purple-300"
                      }`}
                    />
                  </div>

                  <div className="!flex-1 !text-left">
                    <p
                      className={`!font-semibold !transition-colors ${
                        rival.marketShare <= 0
                          ? "!text-gray-500"
                          : "!text-white group-hover:!text-purple-200"
                      }`}
                    >
                      {rival.name}
                    </p>
                    <p className="!text-xs !text-gray-400">
                      Current MS:{" "}
                      <span className="!text-yellow-400 !font-medium">
                        {rival.marketShare}
                      </span>
                      {rival.marketShare <= 0 && (
                        <span className="!text-red-400 !ml-2">
                          (can't go lower)
                        </span>
                      )}
                    </p>
                  </div>

                  {rival.marketShare > 0 && (
                    <div className="!flex !items-center !gap-1 !text-red-400 group-hover:!text-red-300">
                      <TrendingDown className="!h-4 !w-4" />
                      <span className="!text-sm !font-medium">-1</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="!mt-4 !flex !justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSelecting}>
            Cancel
          </Button>
        </div>

        <p className="!text-xs !text-gray-500 !text-center">
          Trendsetter activates automatically each class
        </p>
      </DialogContent>
    </Dialog>
  );
}
