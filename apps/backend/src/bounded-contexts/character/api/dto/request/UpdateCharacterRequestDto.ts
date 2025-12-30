import { ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsOptional, ValidateNested } from "class-validator";
import { BaseCharacterResponseDto } from "../response/BaseCharacterResponseDto.js";
import { VoieProgressInputDto } from "./VoieProgressInputDto.js";

/**
 * DTO for updating a character.
 * 
 * @description
 * Extends BaseCharacterResponseDto but:
 * - Omits read-only fields (characterId, isDeceased, death info)
 * - Overrides voies to use the input DTO (relaxed validation)
 */
export class UpdateCharacterRequestDto extends PartialType(
  OmitType(BaseCharacterResponseDto, [
    "characterId",
    "isDeceased",
    "diedAt",
    "deathLocation",
    "voies", // Override this field below
  ] as const),
) {
  @ApiPropertyOptional({
    description: "Talent tree progression updates. Only voieId and currentRank are required.",
    type: [VoieProgressInputDto],
  })
  @ValidateNested({ each: true })
  @Type(() => VoieProgressInputDto)
  @IsArray()
  @IsOptional()
  voies?: VoieProgressInputDto[];
}
