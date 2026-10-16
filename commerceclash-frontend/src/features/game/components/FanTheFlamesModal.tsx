import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Clock, ShieldAlert, ArrowRight, User } from "lucide-react";
import type { FanTheFlamesOffer } from "../hooks/heroCard/types";
import { useCountdownWindow } from "../hooks/heroCard/useCountdownWindow";
import { cn } from "@/lib/utils";

interface FanTheFlamesModalProps {
  open: boolean;
  onClose: () => void;
  offer: FanTheFlamesOffer | null;
  onRedirect: (targetStudentId: string) => void;
  isRedirecting: boolean;
}

export function FanTheFlamesModal({
  open,
  onClose,
  offer,
  onRedirect,
  isRedirecting,
}: FanTheFlamesModalProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTargetId(null);
  }, [open, offer?.pendingKey]);

  const windowMs = offer?.decisionWindowMs ?? 10000;
  const expiresAt = offer?.expiresAt ?? Date.now() + 10000;

  const { timeLeft, progress, secondsLeft } = useCountdownWindow({
    open: open && !!offer,
    expiresAt,
    windowMs,
    onExpire: onClose,
  });

  const handleConfirmRedirect = useCallback(() => {
    if (!selectedTargetId) return;
    onRedirect(selectedTargetId);
  }, [selectedTargetId, onRedirect]);

  if (!offer) {
    if (!open) return null;
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isRedirecting && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="!bg-gradient-to-br !from-amber-950 !via-red-950 !to-neutral-950 !border-orange-500/50 !text-white !shadow-2xl sm:!max-w-lg !max-h-[90vh] !overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="!flex !items-center !gap-2 !text-orange-400 !text-xl !font-bold">
              <Flame className="!h-6 !w-6 !text-orange-500 !animate-pulse" />
              Fan the Flames — Intercept Loss!
            </DialogTitle>
            <DialogDescription className="!text-gray-300 !text-sm">
              Awaiting redirect offer details...
            </DialogDescription>
          </DialogHeader>
          <div className="!flex !flex-col !items-center !justify-center !py-8 !space-y-3">
            <div className="!h-8 !w-8 !animate-spin !rounded-full !border-4 !border-orange-500 !border-t-transparent" />
            <p className="!text-sm !text-gray-400">Loading incoming attack data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isRedirecting && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!bg-gradient-to-br !from-amber-950 !via-red-950 !to-neutral-950 !border-orange-500/50 !text-white !shadow-2xl sm:!max-w-lg !max-h-[90vh] !overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-orange-400 !text-xl !font-bold">
            <Flame className="!h-6 !w-6 !text-orange-500 !animate-pulse" />
            Fan the Flames — Intercept Loss!
          </DialogTitle>

          <DialogDescription className="!text-gray-300 !text-sm">
            <span className="!font-semibold !text-orange-300">
              {offer.attackerName}
            </span>
            {"'s "}
            <span className="!font-semibold !text-white">
              {offer.sourcePerkTitle}
            </span>
            {" would cost you "}
            <span className="!font-bold !text-red-400">
              -{offer.amount} Market Share
            </span>
            {" Redirect it to another player!"}
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Bar */}
        <div className="!space-y-1.5">
          <div className="!relative !h-2.5 !bg-gray-900 !rounded-full !overflow-hidden !border !border-orange-900/50">
            <div
              className="!absolute !inset-y-0 !left-0 !bg-gradient-to-r !from-orange-500 !via-amber-400 !to-red-500 !transition-all !duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="!flex !items-center !justify-between !text-xs !text-gray-400">
            <span className="!flex !items-center !gap-1 !text-orange-300">
              <Clock className="!h-3.5 !w-3.5" />
              Decision Window
            </span>

            <span
              className={cn(
                "!font-bold !font-mono",
                secondsLeft <= 3
                  ? "!text-red-400 !animate-pulse !text-sm"
                  : "!text-amber-300",
              )}
            >
              {secondsLeft}s left
            </span>
          </div>
        </div>

        {/* Rival Selector */}
        <div className="!space-y-2">
          <p className="!text-xs !uppercase !tracking-wider !font-semibold !text-gray-400">
            Select a rival to receive the loss:
          </p>

          <div className="!max-h-48 !overflow-y-auto !space-y-1.5 !pr-1 !small-scroll">
            {offer.rivals.length === 0 ? (
              <p className="!text-sm !text-gray-400 !text-center !py-4">
                No eligible rivals found.
              </p>
            ) : (
              offer.rivals.map((rival) => {
                const isSelected = selectedTargetId === rival.id;

                return (
                  <button
                    key={rival.id}
                    type="button"
                    disabled={isRedirecting || timeLeft <= 0}
                    onClick={() => setSelectedTargetId(rival.id)}
                    className={cn(
                      "!w-full !flex !items-center !justify-between !p-2.5 !rounded-lg !border !text-left !transition-all",
                      isSelected
                        ? "!bg-orange-500/20 !border-orange-400 !text-white !shadow-md !shadow-orange-500/20 !ring-1 !ring-orange-400"
                        : "!bg-gray-900/50 !border-gray-800 !text-gray-300 hover:!bg-gray-800/60 hover:!border-gray-700",
                    )}
                  >
                    <div className="!flex !items-center !gap-2.5">
                      <div
                        className={cn(
                          "!w-8 !h-8 !rounded-full !flex !items-center !justify-center !text-xs !font-bold",
                          isSelected
                            ? "!bg-orange-500 !text-white"
                            : "!bg-gray-800 !text-gray-400",
                        )}
                      >
                        <User className="!h-4 !w-4" />
                      </div>

                      <div>
                        <div className="!font-semibold !text-sm !leading-tight">
                          {rival.name}
                        </div>

                        <div className="!text-xs !text-gray-400">
                          Current MS:{" "}
                          <span className="!text-amber-300 !font-medium">
                            {rival.marketShare}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="!text-xs !bg-orange-500/30 !text-orange-300 !px-2 !py-0.5 !rounded !font-semibold">
                        Selected Target
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Warning Badge */}
        <div className="!flex !items-center !gap-2 !p-2.5 !bg-orange-950/40 !border !border-orange-800/40 !rounded-lg !text-xs !text-orange-200">
          <ShieldAlert className="!h-4 !w-4 !text-orange-400 !shrink-0" />

          <span>
            If the timer expires, you will take the loss automatically.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="!flex !gap-2.5 !pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isRedirecting}
            className="!flex-1 !border-gray-700 !text-gray-300 hover:!bg-gray-800 hover:!text-white"
          >
            Accept Loss
          </Button>

          <Button
            type="button"
            onClick={handleConfirmRedirect}
            disabled={!selectedTargetId || isRedirecting || timeLeft <= 0}
            className="!flex-1 !bg-gradient-to-r !from-orange-600 !to-red-600 hover:!from-orange-500 hover:!to-red-500 !text-white !font-bold !shadow-lg !shadow-orange-600/30"
          >
            {isRedirecting ? (
              "Redirecting..."
            ) : (
              <span className="!flex !items-center !gap-1.5">
                Redirect -{offer.amount} MS
                <ArrowRight className="!h-4 !w-4" />
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
