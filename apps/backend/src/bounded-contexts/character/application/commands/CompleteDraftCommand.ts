import { ArchetypeName, RaceId } from '#shared';

/**
 * Command to complete a draft character and make it playable
 */
export interface CompleteDraftCommand {
  name: string;
  className: ArchetypeName;
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