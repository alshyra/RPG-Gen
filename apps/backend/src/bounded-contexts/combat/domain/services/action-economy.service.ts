import { Injectable } from "@nestjs/common";
import type { CombatStateDto } from "../../api/dto/response/CombatStateDto.js";
import { CLASS_STATS } from "../scaling.util.js";

/**
 * ActionEconomyService - Manages PA/PM resource system for tactical combat
 * 
 * PA (Points d'Action): Used for abilities/attacks
 * PM (Points de Mouvement): Used for grid movement
 * 
 * Resources are reset at the start of each turn based on class.
 */
@Injectable()
export class ActionEconomyService {
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
   * Reset PA/PM at the start of a turn based on class
   */
  resetResources(state: CombatStateDto): CombatStateDto {
    const className = state.player?.className?.toLowerCase() ?? "guerrier";
    const classStats = CLASS_STATS[className] ?? CLASS_STATS.guerrier;

    const paMax = classStats.pa;
    const pmMax = classStats.pm;

    return {
      ...state,
      player: state.player ? {
        ...state.player,
        pa: paMax,
        paMax: paMax,
        pm: pmMax,
        pmMax: pmMax,
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
