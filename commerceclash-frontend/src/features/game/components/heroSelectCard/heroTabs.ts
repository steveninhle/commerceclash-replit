import { images } from "@/assets";
import type { HeroSelectCardTab } from "./types";

const INACTIVE_TABS: HeroSelectCardTab[] = [
  {
    id: "learn",
    label: "Learn",
    icon: images.tabLearn,
    activeColor: "#1677ff",
  },
  { id: "task", label: "Task", icon: images.tabTask, activeColor: "#8c00ff" },
  {
    id: "invest",
    label: "Invest",
    icon: images.tabInvest,
    activeColor: "#ffe600",
  },
  {
    id: "scenario",
    label: "Scenario",
    icon: images.tabScenario,
    activeColor: "#ff2fb0",
  },
  {
    id: "results",
    label: "Results",
    icon: images.tabResults,
    activeColor: "#00f746",
  },
];

const heroTabs = (): HeroSelectCardTab[] => [
  {
    id: "ceo",
    label: "CEO",
    icon: images.tabCeo,
    activeColor: "var(--hs-primary)",
    active: true,
  },
  ...INACTIVE_TABS,
];

export { heroTabs };
