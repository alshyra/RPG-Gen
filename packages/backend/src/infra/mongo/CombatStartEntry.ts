import {
  Prop, Schema,
} from '@nestjs/mongoose';

@Schema({ _id: false })
export class CombatStartEntry {
  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    required: true,
    type: Number,
  })
  hp: number;

  @Prop({
    required: true,
    type: Number,
  })
  ac: number;

  @Prop({
    required: false,
    type: Number,
  })
  attack_bonus?: number;

  @Prop({
    required: false,
    type: String,
  })
  damage_dice?: string;

  @Prop({
    required: false,
    type: Number,
  })
  damage_bonus?: number;
}
