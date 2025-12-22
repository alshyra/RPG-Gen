import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNumber, IsArray } from "class-validator";
import { TalentRankDto } from "./TalentRankDto.js";

export class VoieProgressDto {
  @ApiProperty({ description: "Talent tree ID" })
  @IsString()
  voieId: string;

  @ApiProperty({ description: "Talent tree display name (e.g., 'Voie de l'Ombre')" })
  @IsString()
  voieName: string;

  @ApiProperty({ description: "Parent class name (guerrier, rogue, mage)" })
  @IsString()
  className: string;

  @ApiProperty({ description: "Current rank unlocked (0-5, where 0 = not started)" })
  @IsNumber()
  currentRank: number;

  @ApiPropertyOptional({ description: "Talent points required to unlock next rank" })
  @IsNumber()
  requiredTalentPoints?: number;

  @ApiPropertyOptional({ description: "IDs of aptitudes unlocked in this voie" })
  @IsArray()
  @IsString({ each: true })
  unlockedAptitudes?: string[];

  @ApiProperty({ description: "All available ranks in this voie with their aptitudes", type: [TalentRankDto] })
  @IsArray()
  ranks: TalentRankDto[];

  constructor(init?: Partial<VoieProgressDto>) {
    if (!init) {
      throw new Error("VoieProgressDto: missing required fields");
    }
    if (!init.voieId) {
      throw new Error("VoieProgressDto: missing required field 'voieId'");
    }
    if (!init.voieName) {
      throw new Error("VoieProgressDto: missing required field 'voieName'");
    }
    if (!init.className) {
      throw new Error("VoieProgressDto: missing required field 'className'");
    }
    if (init.currentRank === undefined) {
      throw new Error("VoieProgressDto: missing required field 'currentRank'");
    }
    if (!init.ranks) {
      throw new Error("VoieProgressDto: missing required field 'ranks'");
    }
    this.voieId = init.voieId;
    this.voieName = init.voieName;
    this.className = init.className;
    this.currentRank = init.currentRank;
    this.requiredTalentPoints = init.requiredTalentPoints;
    this.unlockedAptitudes = init.unlockedAptitudes;
    this.ranks = init.ranks;
  }
}
