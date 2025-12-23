import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// Simple interface (pas de classe, pas de logique)
interface TalentRankData {
  rank: number;
  aptitudeId: string;
  pointCost: number;
}

interface TalentTreeData {
  voieId: string;
  name: string;
  description?: string;
  ranks: TalentRankData[];
}

interface ArchetypeStatsData {
  hpBase: number;
  hpGain: number;
  pa: number;
  pm: number;
}

@Schema({ collection: "archetype_definitions", timestamps: true })
export class ArchetypeDocument extends Document {
  @Prop({ required: true, unique: true })
  name: string; // 'guerrier', 'rogue', 'mage'

  @Prop()
  displayName?: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: Object })
  stats: ArchetypeStatsData;

  @Prop({ type: Array, required: true })
  talentTrees: TalentTreeData[];

  @Prop({ type: [String], default: [] })
  startingAptitudes: string[];

  @Prop({
    type: String,
    enum: ["vigor", "finesse", "mind", "survival"],
  })
  mainStat: string;

  @Prop()
  color?: string;

  @Prop()
  icon?: string;
}

export const ArchetypeSchema = SchemaFactory.createForClass(ArchetypeDocument);
