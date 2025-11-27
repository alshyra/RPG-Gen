import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Race {
  @Prop({ required: false, type: String })
  id: string;

  @Prop({ required: false, type: String })
  name: string;

  @Prop({ type: Object })
  mods: Record<string, number>;
}
