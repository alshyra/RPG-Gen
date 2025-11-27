import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CharacterClass {
  @Prop({ required: false, type: String })
  name: string;

  @Prop({ required: false, type: Number })
  level: number;
}
