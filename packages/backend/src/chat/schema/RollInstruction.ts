import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class RollInstruction {
  @Prop({ required: true, type: String })
  dices: string;

  @Prop({ required: false, type: Object })
  modifier?: string | number;

  @Prop({ required: false, type: String })
  description?: string;

  @Prop({
    required: false,
    type: String,
    enum: [
      'advantage',
      'disadvantage',
      'none',
    ],
  })
  advantage?: 'advantage' | 'disadvantage' | 'none';
}
