import { InternalServerErrorException } from "@nestjs/common";
import { BaseCharacterResponseDto } from "./BaseCharacterResponseDto.js";



export class CharacterResponseDto extends BaseCharacterResponseDto {
  // DTO for fully created characters
  // Portrait is optional as it may be generated after state transition
  constructor(init?: Partial<CharacterResponseDto>) {
    super(init);
    if (!init) throw new InternalServerErrorException("CharacterResponseDto initialized without data");
    if (!init.characterId) throw new InternalServerErrorException("CharacterResponseDto initialized without characterId")
    if(!init.state) throw new InternalServerErrorException("CharacterResponseDto initialized without state")
  }
}
