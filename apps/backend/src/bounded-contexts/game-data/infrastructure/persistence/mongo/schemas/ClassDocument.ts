import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB schema for CharacterClass
 * 
 * @infrastructure game-data
 * Framework-specific (NestJS/Mongoose)
 */

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

interface ClassStatsData {
  hpBase: number;
  hpGain: number;
  pa: number;
  pm: number;
}

@Schema({ collection: 'class_definitions', timestamps: true })
export class ClassDocument extends Document {
  @Prop({ required: true, unique: true })
  name: string; // 'guerrier', 'rogue', 'mage'

  @Prop()
  displayName?: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: Object })
  stats: ClassStatsData;

  @Prop({ type: Array, default: [] })
  talentTrees: TalentTreeData[];

  @Prop({ type: [String], default: [] })
  startingAptitudes: string[];

  @Prop({ type: [String], default: [] })
  proficiencies: string[];

  @Prop({
    type: String,
    enum: ['vigor', 'finesse', 'mind', 'survival'],
    default: 'vigor',
  })
  mainStat: string;

  @Prop()
  color?: string;

  @Prop()
  icon?: string;
}

export const ClassSchema = SchemaFactory.createForClass(ClassDocument);
