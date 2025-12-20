// class-definition.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { TalentTree, TalentTreeSchema } from "./TalentTree.js";

@Schema({ timestamps: true })
export class ClassDefinition {
  @Prop({ required: true, unique: true })
  name: string; // 'Guerrier', 'Rogue', 'Mage'

  @Prop()
  displayName?: string;

  @Prop()
  description?: string;

  @Prop({ required: true, type: Object })
  baseStats: {
    hp_base: number;
    hp_gain?: number;
    pa: number;
    pm: number;
  };

  @Prop({
    type: Object,
    required: false,
  })
  talentTrees: Record<string, TalentTree>; // Les 3 voies par classe

  @Prop({ type: [String] })
  startingAptitudes: string[]; // Les sorts de base (ex: 'frappe_simple')

  @Prop()
  color?: string;

  @Prop()
  icon?: string;

  @Prop()
  main_stat?: string; // Stat principale pour scaling (vigor, finesse, mind, survival)
}

export type ClassDefinitionDocument = ClassDefinition & Document;
export const ClassDefinitionSchema = SchemaFactory.createForClass(ClassDefinition);