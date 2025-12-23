import { InventoryItem } from '#character/domain/entities/CharacterEntity.js';
import { ClassName, RaceId } from '#shared/domain/index.js';

/**
 * Command to update character properties
 * 
 * @description
 * Generic update for administrative purposes.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateCharacterCommand {
  // Basic info
  name?: string;
  physicalDescription?: string;
  portrait?: string;
  gender?: string;

  // Class and race
  className?: ClassName;
  raceId?: RaceId;

  // Progression
  level?: number;
  totalXp?: number;
  inspirationPoints?: number;
  talentPoints?: number;

  // Stats
  stats?: {
    vigor: number;
    finesse: number;
    mind: number;
    survival: number;
  };

  // Resources
  hp?: number;
  hpMax?: number;
  pa?: number;
  paMax?: number;
  pm?: number;
  pmMax?: number;

  // State
  state?: 'draft' | 'created' | 'deceased';

  // Inventory (full replacement)
  inventory?: InventoryItem[];
}