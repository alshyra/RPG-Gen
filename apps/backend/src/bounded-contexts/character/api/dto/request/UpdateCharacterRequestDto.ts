import { OmitType, PartialType } from "@nestjs/swagger";
import { BaseCharacterResponseDto } from "../response/BaseCharacterResponseDto.js";

export class UpdateCharacterRequestDto extends PartialType(
  OmitType(BaseCharacterResponseDto, [
    "characterId",
    "isDeceased",
    "diedAt",
    "deathLocation",
  ] as const),
) {}
