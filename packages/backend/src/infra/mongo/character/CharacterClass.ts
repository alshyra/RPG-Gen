import {
  Prop, Schema,
} from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class CharacterClass {
  @Prop({
    required: false,
    type: String,
  })
  name: string;

  @Prop({
    required: false,
    type: Number,
  })
  level: number;
}

export type CharacterClassDocument = CharacterClass & Document;
