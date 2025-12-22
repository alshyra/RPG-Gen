import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export enum MovementEventType {
  MOVE = "move",
  OPPORTUNITY_ATTACK = "opportunity-attack",
  REACTION = "reaction",
  MOVEMENT_INTERRUPTED = "movement-interrupted",
}

export class MovementEventDto {
  @ApiProperty({
    description: "Event type",
    enum: MovementEventType,
  })
  @IsEnum(MovementEventType)
  type: MovementEventType;

  @ApiProperty({ description: "Actor combatant ID" })
  @IsString()
  actorId: string;

  @ApiPropertyOptional({ description: "Target combatant ID (for attacks)" })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: "Damage dealt (if applicable)" })
  @IsOptional()
  @IsNumber()
  damage?: number;

  @ApiPropertyOptional({ description: "Whether attack hit" })
  @IsOptional()
  hit?: boolean;

  @ApiPropertyOptional({ description: "Description of event" })
  @IsOptional()
  @IsString()
  description?: string;
}
