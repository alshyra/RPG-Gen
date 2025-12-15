import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ _id: false })
export class SpellMeta {
  @Prop({ required: false })
  damageDice?: string;

  @Prop({ required: false })
  healDice?: string;

  @Prop({ required: false })
  damageType?: string;

  @Prop({ required: false })
  saveType?: string;

  @Prop({ required: false })
  attackType?: "melee" | "ranged" | "spell";

  @Prop({ required: false })
  school?: string;

  @Prop({ required: false })
  areaOfEffect?: string;

  @Prop({ required: false })
  scaling?: string;

  [key: string]: unknown;
}

export type SpellMetaDocument = SpellMeta & Document;
export const SpellMetaSchema = SchemaFactory.createForClass(SpellMeta);
