import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TalentRank } from "./TalentRank.js";

@Schema()
export class TalentTree {
  @Prop({ required: true })
  name: string; // ex: 'Voie de l'Ombre'

  @Prop({ type: [TalentRank] })
  ranks: TalentRank[];
}

export const TalentTreeSchema = SchemaFactory.createForClass(TalentTree);
