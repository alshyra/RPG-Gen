import {
  Prop, Schema,
} from '@nestjs/mongoose';

@Schema({ _id: false })
export class SpellInstruction {
  @Prop({
    required: true,
    type: String,
    enum: [
      'learn',
      'cast',
      'forget',
    ],
  })
  action: 'learn' | 'cast' | 'forget';

  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    required: false,
    type: Number,
  })
  level?: number;

  @Prop({
    required: false,
    type: String,
  })
  school?: string;

  @Prop({
    required: false,
    type: String,
  })
  description?: string;
}
