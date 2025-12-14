import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ClassLevelChoice {
  @Prop({ required: true })
  type: string; // 'chooseSubclass', 'chooseAbilityIncrease', 'chooseSkills', etc.

  @Prop({ type: [String], default: [] })
  options?: string[];

  @Prop({ type: Number })
  count?: number;

  @Prop({ type: Number })
  points?: number;

  @Prop({ type: String })
  from?: string; // e.g., 'characterSkills'
}

export const ClassLevelChoiceSchema = SchemaFactory.createForClass(ClassLevelChoice);
