// GENERATED FROM backend/src/schemas - do not edit manually

import { RaceDto } from './race.dto';
import { InventoryItemDto } from './inventoryitem.dto';
import { CharacterClassDto } from './characterclass.dto';
import { SkillDto } from './skill.dto';
import { AbilityScoresDto } from './abilityscores.dto';
import { SpellDto } from './spell.dto';
import { Gender } from './types.dto';

export interface CharacterDto {
  userId: string;
  characterId: string;
  name: string;
  physicalDescription?: string;
  race: RaceDto;
  scores: AbilityScoresDto;
  hp: number;
  hpMax: number;
  totalXp: number;
  classes: CharacterClassDto[];
  skills: SkillDto[];
  world?: string;
  portrait: string;
  gender?: Gender;
  proficiency: number;
  state: "draft" | "created";
  spells?: SpellDto[];
  inventory?: InventoryItemDto[];
  isDeceased: boolean;
  diedAt: Date;
  deathLocation: string;
}
export type CreateCharacterDto = Omit<CharacterDto, 'userId' | 'characterId'>;
export type UpdateCharacterDto = Partial<CreateCharacterDto>;

export type GenderDto = CharacterDto['gender'];
