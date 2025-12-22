/**
 * Unified stat attribute names used across the system
 */
export type StatAttribute = "vigor" | "finesse" | "mind" | "survival";

export const STAT_ATTRIBUTES: ReadonlyArray<StatAttribute> = [
  "vigor",
  "finesse",
  "mind",
  "survival",
];

export const isValidStatAttribute = (value: unknown): value is StatAttribute => {
  return typeof value === "string" && STAT_ATTRIBUTES.includes(value as StatAttribute);
};
