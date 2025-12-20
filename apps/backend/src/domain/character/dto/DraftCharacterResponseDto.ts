import { InternalServerErrorException } from "@nestjs/common";
import { CharacterDocument } from "../../../infra/mongo/index.js";
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
 * Draft characters are newly created and have minimal required fields
 */
export class DraftCharacterResponseDto extends BaseCharacterResponseDto {
  constructor(init?: Partial<DraftCharacterResponseDto> | CharacterDocument) {
    if (!init) throw new InternalServerErrorException("DraftCharacterResponseDto initialized without data");
    if (!init.characterId) throw new InternalServerErrorException("DraftCharacterResponseDto: missing required field 'characterId'");
    if (!init.portrait) throw new InternalServerErrorException("DraftCharacterResponseDto: missing required field 'portrait'");
    if (init.state !== "draft") throw new InternalServerErrorException("DraftCharacterResponseDto: state must be 'draft'");
    if(!init.raceId || !isValidRaceId(init.raceId)) throw new InternalServerErrorException("DraftCharacterResponseDto: missing or invalid required field 'raceId'");
    if (init.className && !isValidClassName(init.className)) {
      throw new InternalServerErrorException(`DraftCharacterResponseDto: invalid className '${init.className}'`);
    }
    super();
    this.characterId = init.characterId;
    this.state = init.state;
    this.portrait = init.portrait;
    this.isDeceased = false;
    this.totalXp = init.totalXp || 0;
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
    this.raceId = init.raceId;
    this.pa = init.pa;
    this.paMax = init.paMax;
    this.pm = init.pm;
    this.pmMax = init.pmMax;
  }
}
