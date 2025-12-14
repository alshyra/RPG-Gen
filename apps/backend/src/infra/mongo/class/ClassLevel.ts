import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ClassLevelFeature, ClassLevelFeatureSchema } from './ClassLevelFeature.js';
import { ClassLevelChoice, ClassLevelChoiceSchema } from './ClassLevelChoice.js';

@Schema({ _id: false })
export class ClassLevel {
  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  proficiencyBonus: number;

  @Prop({ type: Number })
  cantripsKnown?: number;

  @Prop({ type: Number })
  spellsKnown?: number;

  @Prop({ type: Object, default: {} })
  spellSlots?: Record<string, number>; // e.g., { "1": 2, "2": 1 }

  @Prop({
    type: [ClassLevelFeatureSchema],
    default: [],
  })
  features: ClassLevelFeature[];

  @Prop({
    type: [ClassLevelChoiceSchema],
    default: [],
  })
  choices: ClassLevelChoice[];

  @Prop({ type: [Object], default: [] })
  unlockedSpells: unknown[]; // Array of spell references or IDs
}

export const ClassLevelSchema = SchemaFactory.createForClass(ClassLevel);
