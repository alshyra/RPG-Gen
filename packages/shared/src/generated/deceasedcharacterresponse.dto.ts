// GENERATED FROM backend - do not edit manually

import { RaceResponseDto } from './raceresponse.dto';
import { AbilityScoresResponseDto } from './abilityscoresresponse.dto';
import { CharacterClassResponseDto } from './characterclassresponse.dto';
import { SkillResponseDto } from './skillresponse.dto';
import { ItemResponseDto } from './itemresponse.dto';
import { SpellResponseDto } from './spellresponse.dto';

export interface DeceasedCharacterResponseDto {
  characterId: string;
  name?: string;
  physicalDescription?: string;
  race?: RaceResponseDto;
  scores?: AbilityScoresResponseDto;
  hp?: number;
  hpMax?: number;
  totalXp?: number;
  classes?: CharacterClassResponseDto[];
  skills?: SkillResponseDto[];
  world: string;
  portrait: string;
  gender?: string;
  proficiency?: number;
  inspirationPoints?: number;
  isDeceased: boolean;
  diedAt?: string;
  deathLocation?: string;
  state: 'draft' | 'created';
  inventory?: ItemResponseDto[];
  spells?: SpellResponseDto[];
}
