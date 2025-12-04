import { Injectable } from '@nestjs/common';
import type { CombatStateDto } from '../dto/CombatStateDto.js';

@Injectable()
export class ActionEconomyService {
  /**
   * Decrement standard action on the state. Returns true if consumed.
   */
  decrementAction(state: CombatStateDto): boolean {
    if ((state.actionRemaining ?? 0) <= 0) return false;
    state.actionRemaining = (state.actionRemaining ?? 1) - 1;
    return true;
  }

  /**
   * Decrement bonus action on the state. Returns true if consumed.
   */
  decrementBonusAction(state: CombatStateDto): boolean {
    if ((state.bonusActionRemaining ?? 0) <= 0) return false;
    state.bonusActionRemaining = (state.bonusActionRemaining ?? 1) - 1;
    return true;
  }

  /**
   * Reset the action economy for player activation.
   */
  resetActionEconomy(state: CombatStateDto): void {
    state.actionRemaining = state.actionMax ?? 1;
    state.bonusActionRemaining = state.bonusActionMax ?? 1;
  }
}
