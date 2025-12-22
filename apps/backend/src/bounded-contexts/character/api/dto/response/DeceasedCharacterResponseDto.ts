import { BaseCharacterResponseDto } from "./BaseCharacterResponseDto.js";

export class DeceasedCharacterResponseDto extends BaseCharacterResponseDto {
  // This is a variant for documentation/route separation with death info
  constructor(init?: Partial<DeceasedCharacterResponseDto>) {
    super(init as Partial<BaseCharacterResponseDto>);
    this.isDeceased = true;
    if (init?.diedAt) {
      this.diedAt = init.diedAt;
    }
    if (init?.deathLocation) {
      this.deathLocation = init.deathLocation;
    }
  }
}
