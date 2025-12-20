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

export class CharacterResponseDto extends BaseCharacterResponseDto {
  // Exists for semantic separation and future extension
  constructor(init?: Partial<CharacterResponseDto> | CharacterDocument) {
    if (!init) throw new InternalServerErrorException("CharacterResponseDto initialized without data");
    if (!init.characterId) throw new InternalServerErrorException("CharacterResponseDto initialized without characterId")
    if (!init.portrait) throw new InternalServerErrorException("CharacterResponseDto initialized without portrait")
    if(!init.state) throw new InternalServerErrorException("CharacterResponseDto initialized without state")

    super();
    this.characterId = init.characterId;
    this.name = init.name;
    this.hp = init.hp;
    this.hpMax = init.hpMax;
    this.totalXp = init.totalXp;
    this.portrait = init.portrait;
    this.gender = init.gender;
    this.inspirationPoints = init.inspirationPoints;
    this.isDeceased = init.isDeceased || false;
    this.inventory = init.inventory;
    this.diedAt = typeof init.diedAt == 'string' ? init.diedAt : init.diedAt?.toISOString();
    this.deathLocation = init.deathLocation;
    this.physicalDescription = init.physicalDescription;
    this.state = init.state;
    // Tactical system fields - validate enum values
    if (init.className && !isValidClassName(init.className)) {
      throw new InternalServerErrorException(`Invalid className: ${init.className}`);
    }
    if (init.raceId && !isValidRaceId(init.raceId)) {
      throw new InternalServerErrorException(`Invalid raceId: ${init.raceId}`);
    }
    this.className = init.className && isValidClassName(init.className) ? init.className : undefined;
    this.level = init.level;
    this.raceId = init.raceId && isValidRaceId(init.raceId) ? init.raceId : undefined;
    this.stats = init.stats;
    this.pa = init.pa;
    this.paMax = init.paMax;
    this.pm = init.pm;
    this.pmMax = init.pmMax;
  }
}
