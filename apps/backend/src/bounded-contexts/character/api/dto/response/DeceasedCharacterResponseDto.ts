import { BaseCharacterResponseDto } from "./BaseCharacterResponseDto.js";

export class DeceasedCharacterResponseDto extends BaseCharacterResponseDto {
  constructor(data: Partial<DeceasedCharacterResponseDto>) {
    super();
    Object.assign(this, data);
  }
}
