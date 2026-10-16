import { useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, Clock, Zap, BadgeCheck } from "lucide-react";
import { useCountdownWindow } from "../hooks/heroCard/useCountdownWindow";

interface ReveredIconModalProps {
  open: boolean;
  onClose: () => void;
  pendingKey: string;
  rival: {
    id: string;
    name: string;
  };
  perk: {
    id: string;
    title: string;
  };
  cancelWindowMs: number;
  expiresAt: number;
  onCancel: (pendingKey: string) => void;
  isCancelling: boolean;
}

export function ReveredIconModal({
  open,
  onClose,
  pendingKey,
  rival,
  perk,
  cancelWindowMs,
  expiresAt,
  onCancel,
  isCancelling,
}: ReveredIconModalProps) {
  const { timeLeft, progress, secondsLeft } = useCountdownWindow({
    open,
    expiresAt,
    windowMs: cancelWindowMs,
    onExpire: onClose,
  });

  const handleCancel = useCallback(() => {
    onCancel(pendingKey);
  }, [onCancel, pendingKey]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-yellow-900 via-orange-950 to-red-950 border-yellow-500/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-300 text-xl">
            <BadgeCheck className="h-7 w-7 animate-pulse" />
            Revered Icon - Intercept!
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            A rival is trying to activate a perk! Use your Revered Icon to cancel it!
          </DialogDescription>
        </DialogHeader>

        {/* Countdown Progress Bar */}
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center gap-2 text-center">
          <Clock className="h-5 w-5 text-yellow-400" />
          <span className={`text-3xl font-bold ${secondsLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>
            {secondsLeft}s
          </span>
          <span className="text-gray-400">remaining</span>
        </div>

        {/* Rival Info */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
              <Zap className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="text-red-300 font-semibold">{rival.name}</p>
              <p className="text-gray-400 text-sm">is trying to use</p>
              <p className="text-white font-bold text-lg">{perk.title}</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-yellow-200 text-sm text-center">
          ⚠️ Using Revered Icon will consume it permanently!
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isCancelling}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Let it pass
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isCancelling || timeLeft <= 0}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
          >
            {isCancelling ? (
              "Cancelling..."
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                CANCEL PERK
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

