import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eye, User } from "lucide-react";
import { useState, useEffect } from "react";

interface RivalSkill {
  attributeName: string;
  value: number;
}

interface RivalSkillTree {
  studentId: string;
  name: string;
  skills: RivalSkill[];
}

interface RivalSkillTreesModalProps {
  open: boolean;
  onClose: () => void;
  skillTrees: RivalSkillTree[];
}

export function RivalSkillTreesModal({
  open,
  onClose,
  skillTrees,
}: RivalSkillTreesModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [cachedSkillTrees, setCachedSkillTrees] = useState<RivalSkillTree[]>(
    [],
  );

  useEffect(() => {
    if (open && skillTrees.length > 0) {
      setCachedSkillTrees(skillTrees);
    }
  }, [open, skillTrees]);

  const displaySkillTrees = open ? skillTrees : cachedSkillTrees;

  const currentRival = displaySkillTrees[currentIndex] ?? displaySkillTrees[0];

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  const maxSkillValue = 8;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="!sm:max-w-lg !bg-gradient-to-br !from-slate-900 !via-cyan-950 !to-slate-900 !border-cyan-500/50 !shadow-[0_0_50px_rgba(6,182,212,0.3)]">
        <DialogHeader>
          <DialogTitle className="!flex !items-center !gap-2 !text-cyan-400">
            <Eye className="!h-6 !w-6" />
            Corporate Espionage
          </DialogTitle>
          <DialogDescription className="!text-gray-300">
            — View rivals' skill trees. This window will permanently expire
            after closing.
          </DialogDescription>
        </DialogHeader>

        {displaySkillTrees.length === 0 ? (
          <div className="!text-center !text-gray-400 !py-8">
            <p>No rival skill trees to display.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="!flex !flex-wrap !gap-2 !mt-2 !pb-3 !border-b !border-cyan-800/50">
              {displaySkillTrees.map((rival, idx) => (
                <button
                  key={rival.studentId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`!px-3 !py-1.5 !rounded-full !text-sm !font-medium !transition-all ${
                    idx === currentIndex
                      ? "!bg-cyan-600 !text-white !shadow-lg !shadow-cyan-500/30"
                      : "!bg-slate-800 !text-gray-400 hover:!bg-slate-700 hover:!text-gray-200"
                  }`}
                >
                  {rival.name}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="!mt-4">
              <div className="!flex !items-center !gap-3 !mb-4">
                <div className="!w-12 !h-12 !rounded-full !bg-gradient-to-br !from-cyan-600 !to-teal-700 !flex !items-center !justify-center !shadow-lg">
                  <User className="!h-6 !w-6 !text-white" />
                </div>
                <div>
                  <h3 className="!text-xl !font-bold !text-white">
                    {currentRival?.name}
                  </h3>
                  <p className="!text-sm !text-cyan-400">Skill Tree Revealed</p>
                </div>
              </div>

              {/* Skills */}
              <div className="!space-y-3">
                {currentRival?.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="!bg-slate-800/60 !rounded-lg !p-3 !border !border-slate-700/50 hover:!border-cyan-600/50 !transition-colors"
                  >
                    <div className="!flex !justify-between !items-center !mb-2">
                      <span className="!text-gray-200 !font-medium">
                        {skill.attributeName}
                      </span>
                      <span className="!text-cyan-400 !font-bold !text-lg">
                        {skill.value}
                      </span>
                    </div>

                    <div className="!h-2 !bg-slate-700 !rounded-full !overflow-hidden">
                      <div
                        className="!h-full !bg-gradient-to-r !from-cyan-500 !to-teal-400 !rounded-full !transition-all !duration-500"
                        style={{
                          width: `${(skill.value / maxSkillValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
