import { InternalServerErrorException } from "@nestjs/common";
import { CharacterDocument } from "../../../infra/mongo/index.js";
import { BaseCharacterResponseDto } from "./BaseCharacterResponseDto.js";



export class CharacterResponseDto extends BaseCharacterResponseDto {
  // Exists for semantic separation and future extension
  constructor(init?: Partial<CharacterResponseDto> | CharacterDocument) {
    if (!init) throw new InternalServerErrorException("CharacterResponseDto initialized without data");
    if (!init.characterId) throw new InternalServerErrorException("CharacterResponseDto initialized without characterId")
    if (!init.portrait) throw new InternalServerErrorException("CharacterResponseDto initialized without portrait")
    if(!init.state) throw new InternalServerErrorException("CharacterResponseDto initialized without state")

    super(init);
  }
}
