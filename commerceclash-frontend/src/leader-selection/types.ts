import type { LucideIcon } from "lucide-react";

export interface LeaderPerk {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

export interface Leader {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly avatar: string;
  readonly country: string;
  readonly countryFlag: string;
  readonly description: string;
  readonly color: string;
  readonly quote: string;
  readonly strategy: number;
  readonly control: number;
  readonly vision: number;
  readonly influence: number;
  readonly perks: LeaderPerk[];
}

export type LeaderStatKey = "strategy" | "control" | "vision" | "influence";

export interface SeatedPlayer {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly countryFlag: string;
  readonly isCurrentUser: boolean;
}
