import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { SpellMeta, SpellMetaSchema } from "./SpellMeta.js";

@Schema({ _id: false })
export class Spell {
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    required: false,
    type: Number,
  })
  level: number;

  @Prop({
    required: false,
    type: String,
  })
  description: string;

  @Prop({
    type: SpellMetaSchema,
    default: {},
  })
  meta: SpellMeta;

  @Prop({
    required: true,
    type: String,
  })
  definitionId: string;
}

export type SpellDocument = Spell & Document;
