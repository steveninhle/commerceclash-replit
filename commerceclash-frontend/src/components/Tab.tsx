import { CEO } from "@/assets/images";
import { Performance } from "@/features/game/components/Performance";
import { Skill } from "@/features/game/components/Skills";
import { useState } from "react";

const TabNavigation = () => {
  const [activeTab] = useState<"ceo" | "skill" | "performance">(
    "ceo",
  );
  const [refreshKey] = useState(0);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto mt-4 transition-all duration-300">
        {activeTab === "ceo" && (
          <div className="transition-opacity duration-300 animate-in fade-in slide-in-from-top-4">
            <CEO key={`ceo-${refreshKey}`} />
          </div>
        )}
        {activeTab === "skill" && (
          <div className="transition-opacity duration-300 animate-in fade-in slide-in-from-top-4 xl:overflow-hidden">
            <Skill key={`skill-${refreshKey}`} />
          </div>
        )}
        {activeTab === "performance" && (
          <div className="transition-opacity duration-300 animate-in fade-in slide-in-from-top-4">
            <Performance key={`performance-${refreshKey}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TabNavigation;
