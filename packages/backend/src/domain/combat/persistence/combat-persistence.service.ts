import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { CombatStateDto } from '../dto/CombatStateDto.js';
import { CombatSession, CombatSessionDocument } from '../../../infra/mongo/combat-session.schema.js';

/**
 * CombatPersistenceService centralizes raw DB operations for CombatSession.
 * It persists IDs as strings to avoid ObjectId type confusion.
 */
@Injectable()
export class CombatPersistenceService {
  private readonly logger = new Logger(CombatPersistenceService.name);

  constructor(
    @InjectModel(CombatSession.name) private combatSessionModel: Model<CombatSessionDocument>,
  ) {}

  /**
   * Persist (upsert) a full combat state into the DB.
   * Returns the raw Mongoose document (non-lean).
   */
  async saveState(state: CombatStateDto, userId?: string): Promise<CombatSessionDocument | null> {
    if (!state.characterId) throw new BadRequestException('CombatStateDto must have characterId to be persisted');

    // Use arrays directly — no redundant shallow cloning
    const enemies = state.enemies ?? [];
    const turnOrder = state.turnOrder ?? [];

    // Use a relaxed docBody typing to avoid strict ObjectId vs string assignment issues
    const docBody: Partial<Record<keyof CombatSession, unknown>> = {
      characterId: state.characterId,
      inCombat: state.inCombat,
      enemies,
      player: state.player,
      turnOrder,
      currentTurnIndex: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      phase: state.phase,
      actionRemaining: state.actionRemaining,
      actionMax: state.actionMax,
      bonusActionRemaining: state.bonusActionRemaining,
      bonusActionMax: state.bonusActionMax,
    };

    // Only include userId if provided and validate the format;
    // assign as string so Mongoose can cast it to ObjectId on save.
    if (typeof userId !== 'undefined') {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid userId format');
      }
      docBody.userId = userId;
    }

    // Upsert and return the persisted document
    return await this.combatSessionModel
      .findOneAndUpdate(
        { characterId: state.characterId },
        docBody,
        {
          upsert: true,
          new: true,
        },
      )
      .exec();
  }

  /**
   * Get a raw combat session document as a plain object (lean).
   * Returns null if not found.
   */
  async getStateRaw(characterId: string): Promise<Partial<CombatSession> | null> {
    const doc = await this.combatSessionModel.findOne({ characterId })
      .lean()
      .exec();
    return doc ?? null;
  }

  /**
   * Delete a combat session by characterId.
   */
  async deleteState(characterId: string): Promise<void> {
    await this.combatSessionModel.deleteOne({ characterId })
      .exec();
  }
}
