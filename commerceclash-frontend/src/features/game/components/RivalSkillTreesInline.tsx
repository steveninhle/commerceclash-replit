import { useState } from "react";
import { Eye, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface RivalSkill {
  attributeName: string;
  value: number;
}

interface RivalSkillTree {
  studentId: string;
  name: string;
  skills: RivalSkill[];
}

interface RivalSkillTreesInlineProps {
  skillTrees: RivalSkillTree[];
}

const MAX_SKILL = 8;

export function RivalSkillTreesInline({
  skillTrees,
}: RivalSkillTreesInlineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentRival = skillTrees[currentIndex];

  if (skillTrees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center !text-gray-400 py-16 gap-3">
        <Eye className="h-10 w-10 opacity-30" />
        <p className="text-sm">No rival skill trees available.</p>
        <p className="text-xs !text-gray-500">
          Use Corporate Espionage to reveal rivals' skills.
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans !flex !flex-col !py-3 !gap-5 !mt-[40px] !h-screen">
      <div className="!flex !items-center !gap-2 !text-cyan-400 !px-6">
        <Eye className="!h-6 !w-6 " />
        <p className="!text-lg !leading-none !font-semibold !flex !items-center !gap-2 !text-cyan-400">
          Corporate Espionage
        </p>
      </div>

      {/* Tabs */}
      <div className="!flex !flex-wrap !gap-2 !pb-6 !border-b !border-cyan-800/50 !px-6">
        {skillTrees.map((rival, idx) => (
          <button
            key={rival.studentId}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "!px-3 !py-1.5 !rounded-full !text-sm !font-medium !transition-all",
              idx === currentIndex
                ? "!bg-cyan-600 !text-white !shadow-lg !shadow-cyan-500/30"
                : "!bg-slate-800 !text-gray-400 hover:!bg-slate-700 hover:!text-gray-200",
            )}
          >
            {rival.name}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="!flex !items-center !gap-3 !px-6">
        <div className="!w-10 !h-10 !rounded-full !bg-gradient-to-br !from-cyan-600 !to-teal-700 !flex !items-center !justify-center !shadow-lg !flex-shrink-0">
          <User className="!h-5 !w-5 !text-white" />
        </div>
        <div>
          <h3 className="!text-base !font-bold !text-white">
            {currentRival?.name}
          </h3>
          <p className="!text-sm !text-cyan-400">Skill Tree Revealed</p>
        </div>
      </div>

      {/* Skills */}
      <div className="!flex-1 !overflow-y-auto !space-y-2 scrollbar-hide !px-6">
        {currentRival?.skills.map((skill, idx) => (
          <div
            key={idx}
            className="!bg-slate-800/60 !rounded-lg !p-3 !border !border-slate-700/50 hover:!border-cyan-600/50 !transition-colors"
          >
            <div className="!flex !justify-between !items-center !mb-2">
              <span className="!text-gray-200 !font-medium !text-sm">
                {skill.attributeName}
              </span>
              <span className="!text-cyan-400 !font-bold">{skill.value}</span>
            </div>

            <div className="!h-2 !bg-slate-700 !rounded-full !overflow-hidden">
              <div
                className="!h-full !bg-gradient-to-r !from-cyan-500 !to-teal-400 !rounded-full !transition-all !duration-500"
                style={{ width: `${(skill.value / MAX_SKILL) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
