import { Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MasterpieceReward } from "../hooks/heroCard/useMasterpieceFlow";

export function MasterpieceRewardModal({ reward, onClose }: {
  reward: MasterpieceReward | null;
  onClose: () => void;
}) {
  if (!reward) return null;
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="!max-h-[90vh] !overflow-y-auto sm:!max-w-md !border-amber-400/40 !bg-gradient-to-br !from-amber-950 !via-zinc-950 !to-neutral-950 !text-white !shadow-2xl">
        <div className="!mx-auto !flex !h-20 !w-20 !items-center !justify-center !rounded-full !border !border-amber-400/40 !bg-amber-400/10 !shadow-lg !shadow-amber-500/20">
          <Trophy className="!h-10 !w-10 !text-amber-300 motion-safe:animate-pulse" aria-hidden="true" />
        </div>
        <DialogHeader className="!text-center">
          <DialogTitle className="!text-center !text-2xl !font-bold !text-amber-300">Masterpiece!</DialogTitle>
          <DialogDescription className="!text-center !text-zinc-300 !break-words">
            You maxed out <span className="!font-semibold !text-white">{reward.pillar}</span>. Your hard work paid off!
          </DialogDescription>
        </DialogHeader>
        <div className="!rounded-xl !border !border-amber-400/30 !bg-amber-400/10 !p-5 !text-center">
          <div className="!flex !items-center !justify-center !gap-2 !text-4xl !font-black !text-amber-300">
            <Sparkles className="!h-6 !w-6" aria-hidden="true" />+{reward.pointsGained}
          </div>
          <p className="!mt-2 !text-sm !text-amber-100">Skill point added to your pool</p>
        </div>
        <p className="!text-center !text-sm !text-zinc-400">Your reward is ready to spend on another pillar.</p>
        <Button onClick={onClose} className="!w-full !bg-amber-400 !font-bold !text-amber-950 hover:!bg-amber-300">Nice!</Button>
      </DialogContent>
    </Dialog>
  );
}
