import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class InventoryInstruction {
  @Prop({ required: true, type: String, enum: [
    'add',
    'remove',
    'use',
  ] })
  action: 'add' | 'remove' | 'use';

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: Number })
  quantity?: number;

  @Prop({ required: false, type: String })
  description?: string;
}
