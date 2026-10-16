import {
  images,
  Innovation,
  Logistic,
  Marketing,
  Quality,
  Team,
} from "@/assets";

export const HEROES = [
  {
    id: "1",
    title: "THE BARON",
    subtitle: "Tyrant of Wealth",
    description:
      "The Diplomat sways others with charm and cunning, striking at the perfect moment to weaken her rivals.",
    difficulty: 3,
    playstyle: "Subtle Manipulation",
    growth: 3,
    risk: 2,
    influence: 5,
    perks: [
      {
        tier: "Core" as const,
        name: "Sabotage",
        text: "Once per game, remove 3 temporary skill points from one opponent’s category.",
      },
      {
        tier: "Ultra" as const,
        name: "Trendsetter",
        text: "When you win a scenario, force any opponent to lose 1 Market Share while you gain +1.",
      },
    ],
    logoSrc: images.baronLogo,
    imageSrc: images.baron,
    imageAlt: "The Diplomat character poster — Master of Influence",
  },
  {
    id: "2",
    title: "THE TYCOON",
    subtitle: "Unstoppable Force",
    description:
      "The Strategist excels at long-term planning, ensuring every move builds toward inevitable victory.",
    difficulty: 4,
    playstyle: "Calculated Planning",
    growth: 4,
    risk: 2,
    influence: 3,
    perks: [
      {
        tier: "Core" as const,
        name: "Forecast",
        text: "Peek at the next 2 scenario cards and rearrange them once per game.",
      },
      {
        tier: "Ultra" as const,
        name: "Chain Reaction",
        text: "Whenever you complete a goal, immediately gain +1 additional reward of the same type.",
      },
    ],
    logoSrc: images.tycoonLogo,
    imageSrc: images.tycoon,
    imageAlt: "The Strategist character poster — Master of Tactics",
  },
  {
    id: "3",
    title: "THE DIPLOMAT",
    subtitle: "MASTER OF INFLUENCE",
    description:
      "The Visionary thrives on bold risks and groundbreaking ideas, reshaping the market to her design.",
    difficulty: 2,
    playstyle: "Creative Disruption",
    growth: 5,
    risk: 4,
    influence: 3,
    perks: [
      {
        tier: "Core" as const,
        name: "Prototype",
        text: "Play one additional strategy card per round.",
      },
      {
        tier: "Ultra" as const,
        name: "Revolution",
        text: "When you gain Market Share, gain +1 extra if you were behind.",
      },
    ],
    logoSrc: images.diplomatLogo,
    imageSrc: images.diplomat,
    imageAlt: "The Visionary character poster — Master of Innovation",
  },
  {
    id: "4",
    title: "THE VISIONARY",
    subtitle: "Shaper of Destiny",
    description:
      "The Executor dominates through direct action and decisive strikes, leaving little room for opposition.",
    difficulty: 3,
    playstyle: "Aggressive Control",
    growth: 2,
    risk: 5,
    influence: 4,
    perks: [
      {
        tier: "Core" as const,
        name: "Dominate",
        text: "Force one opponent to skip their next turn once per game.",
      },
      {
        tier: "Ultra" as const,
        name: "Overwhelming Force",
        text: "Whenever you play a power move, gain +2 Influence immediately.",
      },
    ],
    logoSrc: images.visionaryLogo,
    imageSrc: images.visionary,
    imageAlt: "The Executor character poster — Master of Power",
  },
  {
    id: "5",
    title: "THE EXPLORER",
    subtitle: "Trailblazer of Fate",
    description:
      "The Negotiator excels at forging alliances and extracting value from every interaction.",
    difficulty: 2,
    playstyle: "Cooperative Leverage",
    growth: 3,
    risk: 3,
    influence: 5,
    perks: [
      {
        tier: "Core" as const,
        name: "Bargain",
        text: "Once per round, exchange a card from your hand with one from the discard pile.",
      },
      {
        tier: "Ultra" as const,
        name: "Alliance",
        text: "When an opponent gains Market Share, you may choose to also gain +1.",
      },
    ],
    logoSrc: images.explorerLogo,
    imageSrc: images.explorer,
    imageAlt: "The Negotiator character poster — Master of Deals",
  },
  {
    id: "6",
    title: "THE GENERAL",
    subtitle: "Voice of Authority",
    description:
      "The Tycoon builds vast resources and uses sheer economic might to control the board.",
    difficulty: 4,
    playstyle: "Resource Domination",
    growth: 5,
    risk: 3,
    influence: 4,
    perks: [
      {
        tier: "Core" as const,
        name: "Capital Surge",
        text: "Start with +2 extra resources at the beginning of the game.",
      },
      {
        tier: "Ultra" as const,
        name: "Monopoly",
        text: "Whenever you gain a resource, opponents gain none during that phase.",
      },
    ],
    logoSrc: images.generalLogo,
    imageSrc: images.general,
    imageAlt: "The Tycoon character poster — Master of Wealth",
  },
  {
    id: "7",
    title: "THE MAVERICK",
    subtitle: "Full throttle",
    description:
      "He moves fast, takes risks, and somehow lands on his feet. While others wait for permission, he's already airborne.",
    imageSrc: images.maverickCenterBg,
    imageAlt: "The Maverick character poster",
  },
  {
    id: "8",
    title: "THE SHADOW",
    subtitle: "The Unseen Eye",
    description:
      "Silent, patient, and impossible to predict. By the time rivals notice the plan, it's already too late.",
    imageSrc: images.shadowCenterBg,
    imageAlt: "The Shadow character poster",
  },
  {
    id: "9",
    title: "THE ARCHITECT",
    subtitle: "Let it grow",
    description:
      "Calm, precise, and endlessly creative, she turns imagination into reality. What begins as a simple idea soon becomes something extraordinary.",
    imageSrc: images.architectCenterBg,
    imageAlt: "The Architect character poster",
  },
  {
    id: "10",
    title: "THE PHOENIX",
    subtitle: "Risen from the Ashes",
    description:
      "A survivor, a fighter, a force of nature. No matter how hard she falls, she rises stronger, turning every setback into a soaring comeback.",
    imageSrc: images.phoenixCenterBg,
    imageAlt: "The Phoenix character poster",
  },
  {
    id: "11",
    title: "THE SHOWMAN",
    subtitle: "Unmatched Charisma",
    description:
      "A natural-born entertainer with unmatched charisma and star power. People follow you and are drawn to your big personality.",
    imageSrc: images.showmanCenterBg,
    imageAlt: "The Showman character poster",
  },
  {
    id: "12",
    title: "THE ORACLE",
    subtitle: "The All-Seeing Eye",
    description:
      "A natural-born entertainer with unmatched charisma and star power. People follow you and are drawn to your big personality.",
    imageSrc: images.oracleCenterBg,
    imageAlt: "The Oracle character poster",
  },
];

export const defaultCategories: {
  key: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  position: { top: string; left: string };
}[] = [
  {
    key: "1",
    label: "Team",
    Icon: Team,
    position: { top: "90%", left: "73%" },
  },
  {
    key: "2",
    label: "Logistics",
    Icon: Logistic,
    position: { top: "90%", left: "26%" },
  },
  {
    key: "3",
    label: "Marketing",
    Icon: Marketing,
    position: { top: "45%", left: "10%" },
  },
  {
    key: "4",
    label: "Innovation",
    Icon: Innovation,
    position: { top: "13%", left: "50%" },
  },
  {
    key: "5",
    label: "Quality",
    Icon: Quality,
    position: { top: "45%", left: "92%" },
  },
];
