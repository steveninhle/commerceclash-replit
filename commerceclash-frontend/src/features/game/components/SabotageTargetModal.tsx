import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BombIcon, User } from "lucide-react";
import { CharacterName, studentCeoAssets } from "@/utils/helper";

interface Rival {
  id: string;
  name: string;
  marketShare?: number;
  ceo?: { title: string };
}

interface SabotageTargetModalProps {
  open: boolean;
  onClose: () => void;
  rivals: Rival[];
  onSelectTarget: (targetId: string) => void;
  isSelecting: boolean;
}

export function SabotageTargetModal({
  open,
  onClose,
  rivals,
  onSelectTarget,
  isSelecting,
}: SabotageTargetModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!sm:max-w-md !bg-gradient-to-br !from-gray-900 !to-red-950 !border-red-500/50"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-red-400 ">
            <BombIcon className="!h-6 !w-6" />
            Sabotage - Select Target
          </DialogTitle>
          <DialogDescription className="!text-gray-300 !text-left !ml-1">
            Choose a rival to sabotage. You'll see their skill tree and can
            redistribute up to 3 of their points to mess up their build!
          </DialogDescription>
        </DialogHeader>

        <div className="!space-y-3 !mt-4">
          {rivals.length === 0 ? (
            <p className="!text-center !text-gray-400 !py-4">
              No rivals available to sabotage.
            </p>
          ) : (
            <div className="!max-h-[425px] !overflow-y-auto !space-y-3 small-scroll">
              {rivals.map((rival) => {
                const ceoAssets = rival.ceo?.title
                  ? studentCeoAssets(rival.ceo.title as CharacterName)
                  : null;

                return (
                  <button
                    key={rival.id}
                    onClick={() => onSelectTarget(rival.id)}
                    disabled={isSelecting}
                    className="!w-full !flex !items-center !gap-3 !p-4 !bg-gray-800/50 hover:!bg-red-900/50 !border !border-gray-700 hover:!border-red-500/50 !rounded-lg !transition-all disabled:!opacity-50 disabled:!cursor-not-allowed group"
                  >
                    <div className="!w-10 !h-10 !rounded-full !bg-gray-700 group-hover:!bg-red-800 !flex !items-center !justify-center !transition-colors">
                      <User className="!h-5 !w-5 !text-gray-300 group-hover:!text-red-300" />
                    </div>

                    <div className="!flex-1 !text-left">
                      <div className="!flex !gap-x-3 !items-center">
                        <p className="!font-semibold !text-white group-hover:!text-red-200 !transition-colors">
                          {rival.name}
                        </p>

                        {ceoAssets && (
                          <img
                            src={ceoAssets?.logoSrc}
                            alt={rival?.ceo?.title}
                            className={`!object-contain ${
                              rival?.ceo?.title === "The Diplomat"
                                ? "!w-5 !h-5"
                                : "!w-6 !h-6"
                            }`}
                          />
                        )}
                      </div>

                      <p className="!text-xs !text-gray-400">
                        Market Share: {rival?.marketShare ?? "N/A"}
                      </p>
                    </div>

                    <BombIcon className="!h-5 !w-5 !text-gray-500 group-hover:!text-red-400 !transition-colors" />
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
            className="!w-full !border-red-500/40 !bg-red-950/30 !text-red-300 hover:!border-red-400/70 hover:!bg-red-900/50 hover:!text-red-100 !transition-all !duration-200 disabled:!cursor-not-allowed disabled:!opacity-50"
          >
            {" "}
            Cancel{" "}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
