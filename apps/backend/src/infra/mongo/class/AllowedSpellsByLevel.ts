import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class AllowedSpellsByLevel {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  definitionId: string;
}

export type AllowedSpellsByLevelDocument = AllowedSpellsByLevel & Document;
export const AllowedSpellsByLevelSchema = SchemaFactory.createForClass(AllowedSpellsByLevel);
