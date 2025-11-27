import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Spell {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: Number })
  level: number;

  @Prop({ required: false, type: String })
  description: string;

  @Prop({ type: Object })
  meta: Record<string, any>;
}
