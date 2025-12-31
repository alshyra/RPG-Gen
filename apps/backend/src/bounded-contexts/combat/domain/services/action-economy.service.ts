import { Injectable, Logger } from "@nestjs/common";
import type { CombatStateDto } from "../../api/dto/response/CombatStateDto.js";

/**
 * ActionEconomyService - Manages PA/PM resource system for tactical combat
 * 
 * PA (Points d'Action): Used for abilities/attacks
 * PM (Points de Mouvement): Used for grid movement
 * 
 * Resources are reset at the start of each turn based on paMax/pmMax stored in player state.
 * These values come from class data seed files, not hardcoded values.
 */
@Injectable()
export class ActionEconomyService {
  private readonly logger = new Logger(ActionEconomyService.name);
  /**
   * Consume PA for an action. Returns updated state.
   */
  consumePA(state: CombatStateDto, cost: number = 1): CombatStateDto {
    const currentPA = state.player?.pa ?? 0;
    if (currentPA < cost) return state;

    const newPA = currentPA - cost;
    
    return {
      ...state,
      player: state.player ? {
        ...state.player,
        pa: newPA,
      } : state.player,
    };
  }

  /**
   * Consume PM for movement. Returns updated state.
   */
  consumePM(state: CombatStateDto, cost: number = 1): CombatStateDto {
    const currentPM = state.player?.pm ?? 0;
    if (currentPM < cost) return state;

    const newPM = currentPM - cost;
    
    return {
      ...state,
      player: state.player ? {
        ...state.player,
        pm: newPM,
      } : state.player,
    };
  }

  /**
   * Check if player has enough PA for an action
   */
  hasEnoughPA(state: CombatStateDto, cost: number = 1): boolean {
    const currentPA = state.player?.pa ?? 0;
    return currentPA >= cost;
  }

  /**
   * Check if player has enough PM for movement
   */
  hasEnoughPM(state: CombatStateDto, cost: number = 1): boolean {
    const currentPM = state.player?.pm ?? 0;
    return currentPM >= cost;
  }

  /**
   * Reset PA/PM at the start of a turn based on stored max values.
   * The paMax/pmMax values MUST be initialized from class stats when combat starts.
   */
  resetResources(state: CombatStateDto): CombatStateDto {
    if (!state.player?.paMax || !state.player?.pmMax) {
      this.logger.warn("Missing paMax/pmMax in player state - resources may not be set correctly");
    }
    
    const paMax = state.player?.paMax ?? 0;
    const pmMax = state.player?.pmMax ?? 0;

    return {
      ...state,
      player: state.player ? {
        ...state.player,
        pa: paMax,
        pm: pmMax,
      } : state.player,
    };
  }

  /**
   * @deprecated Use consumePA instead
   */
  decrementAction(state: CombatStateDto): CombatStateDto {
    return this.consumePA(state, 1);
  }
}
