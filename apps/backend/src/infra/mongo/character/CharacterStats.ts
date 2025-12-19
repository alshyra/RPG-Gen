import { Prop, Schema } from "@nestjs/mongoose";


@Schema({ _id: false })
export class CharacterStats {
  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  vigor: number;

  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  finesse: number;

  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  mind: number;

  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  survival: number;
}
