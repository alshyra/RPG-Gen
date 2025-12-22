import { InternalServerErrorException } from "@nestjs/common";
import { CharacterDocument } from "../../../infrastructure/persistence/mongo/schemas/CharacterDocument.js";
import { BaseCharacterResponseDto } from "./BaseCharacterResponseDto.js";

// Type guards for enum values
const isValidClassName = (value: unknown): value is 'guerrier' | 'rogue' | 'mage' => {
  return ['guerrier', 'rogue', 'mage'].includes(value as string);
};

const isValidRaceId = (value: unknown): value is 'humain' | 'nain' | 'elfe' | 'dark_elfe' | 'orc' => {
  return ['humain', 'nain', 'elfe', 'dark_elfe', 'orc'].includes(value as string);
};

/**
 * DTO for characters in draft state
 * Draft characters are newly created and have minimal required fields.
 * Portrait and raceId are set in subsequent steps.
 */
export class DraftCharacterResponseDto extends BaseCharacterResponseDto {
  constructor(init?: Partial<DraftCharacterResponseDto> | CharacterDocument) {
    if (!init) throw new InternalServerErrorException("DraftCharacterResponseDto initialized without data");
    if (!init.characterId) throw new InternalServerErrorException("DraftCharacterResponseDto: missing required field 'characterId'");
    if (init.state !== "draft") throw new InternalServerErrorException("DraftCharacterResponseDto: state must be 'draft'");

    super(init);
    this.characterId = init.characterId;
    this.state = init.state;
    if (init.portrait) {
      this.portrait = init.portrait;
    } 
    this.isDeceased = false;
    this.totalXp = init.totalXp || 0;
    this.state = 'draft';
    this.isDeceased = false;
    this.inventory = [];
    this.stats = init.stats;
    this.inventory = init.inventory || [];
    this.stats = init.stats;
    
    // Optional fields
    this.name = init.name;
    this.hp = init.hp;
    this.hpMax = init.hpMax;
    this.gender = init.gender;
    this.inspirationPoints = init.inspirationPoints;
    this.physicalDescription = init.physicalDescription;
    this.className = init.className && isValidClassName(init.className) ? init.className : undefined;
    this.level = init.level;
    if(init.raceId) {
      if(!isValidRaceId(init.raceId)) throw new InternalServerErrorException("DraftCharacterResponseDto: state must be 'draft'");
      this.raceId = init.raceId;
    }
    this.pa = init.pa;
    this.paMax = init.paMax;
    this.pm = init.pm;
    this.pmMax = init.pmMax;
  }
}
