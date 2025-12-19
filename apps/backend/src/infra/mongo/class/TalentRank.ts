// talent-tree.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class TalentRank {
  @Prop({ required: true })
  rank: number; // 1, 2, 3, 4, 5

  @Prop({ required: true })
  aptitudeId: string; // Référence vers le spells_db.json

  @Prop({ default: 1 })
  pointCost: number; // Coût pour débloquer ce rang
}

export const TalentRankSchema = SchemaFactory.createForClass(TalentRank);

