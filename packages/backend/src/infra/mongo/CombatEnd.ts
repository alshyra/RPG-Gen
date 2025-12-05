import {
  Prop, Schema,
} from '@nestjs/mongoose';

@Schema({ _id: false })
export class CombatEnd {
  @Prop({
    required: true,
    type: Boolean,
  })
  victory: boolean;

  @Prop({
    required: true,
    type: Number,
  })
  xp_gained: number;

  @Prop({
    required: true,
    type: Number,
  })
  player_hp: number;

  @Prop({
    required: true,
    type: [String],
  })
  enemies_defeated: string[];

  @Prop({
    required: false,
    type: Boolean,
  })
  fled?: boolean;

  @Prop({
    required: true,
    type: String,
  })
  narrative: string;
}
