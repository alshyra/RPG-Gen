/**
 * Shared API request/response types for RPG-Gen
 */


/**
 * Dice roll request
 */
export interface DiceRequest {
  expr: string; // Dice expression like "1d6+2"
}
