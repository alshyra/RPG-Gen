import {
  Prop, Schema, SchemaFactory,
} from '@nestjs/mongoose';
import {
  Document, Schema as MongooseSchema,
} from 'mongoose';

export type ActionRecordDocument = ActionRecord & Document;

export enum ActionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPLIED = 'APPLIED',
  FAILED = 'FAILED',
}

@Schema({ timestamps: true })
export class ActionRecord {
  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  actionToken: string;

  @Prop({
    required: false,
    type: String,
  })
  idempotencyKey?: string;

  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  requesterId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    type: String,
  })
  combatId: string;

  @Prop({
    required: true,
    type: String,
  })
  expectedDto: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ActionStatus),
    default: ActionStatus.PENDING,
  })
  status: ActionStatus;

  @Prop({ type: MongooseSchema.Types.Mixed })
  resultPayload?: unknown;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const ActionRecordSchema = SchemaFactory.createForClass(ActionRecord);

// Unique index for token
ActionRecordSchema.index({ actionToken: 1 }, { unique: true });
// TTL (optional) will be set if expiresAt is provided
ActionRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
