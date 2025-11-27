import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Skill {
  @Prop({ required: false, type: String })
  name: string;

  @Prop({ required: false, type: Boolean })
  proficient: boolean;

  @Prop({ required: false, type: Number })
  modifier: number;
}
