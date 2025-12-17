import { ApiProperty } from "@nestjs/swagger";
import type CombatOptionMeta from "../types/CombatOptionMeta.js";
import { CombatOption } from "../../../infra/mongo/class/CombatOption.js";

export class CombatOptionDto {
  @ApiProperty({ description: "Option id" })
  id: string;

  @ApiProperty({ description: "Display name" })
  name: string;

  @ApiProperty({ description: "Description" })
  description: string;

  @ApiProperty({ description: "Additional metadata (typed)" })
  meta: CombatOptionMeta;

  constructor(combatOption: CombatOption) {
    this.id = combatOption.id;
    this.name = combatOption.name;
    this.description = combatOption.description;
    this.meta = combatOption.meta;
  }
}
