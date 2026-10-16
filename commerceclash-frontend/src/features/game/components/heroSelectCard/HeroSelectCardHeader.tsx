import { cn } from "@/lib/utils";
import { HeroSelectCardTabs } from "./HeroSelectCardTabs";
import type { HeroSelectCardTab } from "./types";

type HeroSelectCardHeaderProps = {
  tabs: HeroSelectCardTab[];
};

const HeroSelectCardHeader = ({ tabs }: HeroSelectCardHeaderProps) => {
  return (
    <div className={cn("w-full")}>
      <HeroSelectCardTabs tabs={tabs} />
    </div>
  );
};

export { HeroSelectCardHeader };
