/**
 * Trait effect - structured object describing racial trait behavior
 */
export interface TraitEffectData {
  type: string;
  value: number;
  condition?: string;
  subType?: string;
}
