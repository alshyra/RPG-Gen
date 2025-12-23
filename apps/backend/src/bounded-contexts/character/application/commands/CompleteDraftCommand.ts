import { ClassName, RaceId } from '#shared/domain/index.js';

/**
 * Command to complete a draft character and make it playable
 */
export interface CompleteDraftCommand {
  name: string;
  className: ClassName;
  raceId: RaceId;
  stats: {
    vigor: number;
    finesse: number;
    mind: number;
    survival: number;
  };
  physicalDescription?: string;
  gender?: string;
  portrait?: string;
}