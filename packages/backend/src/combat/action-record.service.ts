import {
  Injectable, Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  ActionRecord, ActionRecordDocument, ActionStatus,
} from './action-record.schema.js';

@Injectable()
export class ActionRecordService {
  private readonly logger = new Logger(ActionRecordService.name);

  constructor(
    @InjectModel(ActionRecord.name) private readonly actionModel: Model<ActionRecordDocument>,
  ) {}

  /**
   * Generate a new action token for a combat turn.
   * The token is persisted with PENDING status and includes metadata about expected DTO.
   */
  async generateToken(metadata: {
    requesterId: string;
    combatId: string;
    expectedDto: string;
    ttlMinutes?: number;
  }): Promise<string> {
    const actionToken = `t-${randomUUID()}`;
    const ttlMinutes = metadata.ttlMinutes ?? 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.actionModel.create({
      actionToken,
      requesterId: metadata.requesterId,
      combatId: metadata.combatId,
      expectedDto: metadata.expectedDto,
      status: ActionStatus.PENDING,
      expiresAt,
    });

    this.logger.debug(`Generated action token ${actionToken} for combat ${metadata.combatId}`);
    return actionToken;
  }

  async getByToken(actionToken: string) {
    return this.actionModel.findOne({ actionToken })
      .lean()
      .exec();
  }

  /**
   * Try to acquire a token for processing. If the token does not exist it will be created with status PENDING.
   * Then an atomic update is attempted to move it to PROCESSING to obtain a lock.
   * Returns the document (after locking) or null if it cannot be acquired because it's already APPLIED.
   */
  async tryAcquire(actionToken: string, metadata: {
    requesterId: string;
    combatId: string;
    expectedDto: string;
    idempotencyKey?: string;
  }) {
    // Ensure record exists (create if missing)
    try {
      await this.actionModel.updateOne(
        { actionToken },
        {
          $setOnInsert: {
            actionToken,
            requesterId: metadata.requesterId,
            combatId: metadata.combatId,
            expectedDto: metadata.expectedDto,
            status: ActionStatus.PENDING,
            idempotencyKey: metadata.idempotencyKey,
          },
        },
        { upsert: true },
      )
        .exec();
    } catch (err) {
      this.logger.warn(`Upsert failed for token ${actionToken}: ${err}`);
    }

    // Try to atomically set PROCESSING if not already APPLIED
    const acquired = await this.actionModel.findOneAndUpdate(
      {
        actionToken,
        status: { $ne: ActionStatus.APPLIED },
        $or: [
          { status: ActionStatus.PENDING },
          { status: ActionStatus.FAILED },
        ],
      },
      {
        $set: {
          status: ActionStatus.PROCESSING,
          updatedAt: new Date(),
        },
      },
      { new: true },
    )
      .lean()
      .exec();

    if (!acquired) {
      // Check if it's already APPLIED
      const existing = await this.getByToken(actionToken);
      if (existing && existing.status === ActionStatus.APPLIED) return {
        acquired: false,
        record: existing,
      };
      return {
        acquired: false,
        record: existing,
      };
    }

    return {
      acquired: true,
      record: acquired,
    };
  }

  async setApplied(actionToken: string, resultPayload: unknown, opts?: {
    idempotencyKey?: string;
    requesterId?: string;
  }) {
    const update: any = {
      status: ActionStatus.APPLIED,
      resultPayload,
      updatedAt: new Date(),
    };
    if (opts?.idempotencyKey) update.idempotencyKey = opts.idempotencyKey;
    if (opts?.requesterId) update.requesterId = opts.requesterId;

    return this.actionModel.findOneAndUpdate({ actionToken }, { $set: update }, { new: true })
      .lean()
      .exec();
  }

  async setFailed(actionToken: string, errorPayload: unknown) {
    return this.actionModel.findOneAndUpdate({ actionToken }, {
      $set: {
        status: ActionStatus.FAILED,
        resultPayload: errorPayload,
        updatedAt: new Date(),
      },
    }, { new: true })
      .lean()
      .exec();
  }

  /**
   * Update the record to expect another DTO and set it back to PENDING.
   * Useful for multi-step sequences where the first step produces an instruction
   * and the next step will submit the final payload (e.g. attack -> resolve-roll).
   */
  async setPendingWithExpected(actionToken: string, expectedDto: string, partialPayload?: unknown, opts?: { requesterId?: string }) {
    const update: any = {
      status: ActionStatus.PENDING,
      expectedDto,
      updatedAt: new Date(),
    };
    if (partialPayload !== undefined) update.resultPayload = partialPayload;
    if (opts?.requesterId) update.requesterId = opts.requesterId;

    return this.actionModel.findOneAndUpdate({ actionToken }, { $set: update }, { new: true })
      .lean()
      .exec();
  }
}
