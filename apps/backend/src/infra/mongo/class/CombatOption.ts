import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class CombatOption {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, unknown>;
}

export const CombatOptionSchema = SchemaFactory.createForClass(CombatOption);

export default CombatOption;
