import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false })
export class ClassLevelFeature {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ type: Object, default: {} })
  meta?: Record<string, unknown>;
}

export const ClassLevelFeatureSchema = SchemaFactory.createForClass(ClassLevelFeature);
