import { Prop, Schema } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ _id: false })
export class AbilityScores {
  @Prop({
    required: false,
    type: Number,
  })
  Str: number;

  @Prop({
    required: false,
    type: Number,
  })
  Dex: number;

  @Prop({
    required: false,
    type: Number,
  })
  Con: number;

  @Prop({
    required: false,
    type: Number,
  })
  Int: number;

  @Prop({
    required: false,
    type: Number,
  })
  Wis: number;

  @Prop({
    required: false,
    type: Number,
  })
  Cha: number;
}

export type AbilityScoresDocument = AbilityScores & Document;
