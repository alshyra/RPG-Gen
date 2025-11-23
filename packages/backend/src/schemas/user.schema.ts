import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, type: String })
  googleId: string;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ type: String })
  displayName: string;

  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;

  @Prop({ type: String })
  picture: string;

  @Prop({ default: Date.now, type: Date })
  lastLogin: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
