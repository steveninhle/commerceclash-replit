import type { SeatedPlayer } from "../types";

export const TOTAL_SEATS = 5;

export const SEATED_PLAYERS: SeatedPlayer[] = [
  { id: "p1", name: "Mike Davidson", country: "United States", countryFlag: "🇺🇸", isCurrentUser: false },
  { id: "p2", name: "Amanda Brown", country: "Sweden", countryFlag: "🇸🇪", isCurrentUser: false },
  { id: "p3", name: "Aria Zhou", country: "Canada", countryFlag: "🇨🇦", isCurrentUser: true },
];
