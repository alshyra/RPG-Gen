import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CombatInstruction {
  @Prop({
    required: true,
    type: String,
  })
  type: string;

  @Prop({
    required: false,
    type: Object,
  })
  payload: Record<string, any>;
}
