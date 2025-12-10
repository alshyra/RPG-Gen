import type {
  CombatEngineEventType,
  CombatEngineEventPayload,
  EventHandler,
} from '../types/combat-types';

// Module-level singleton: persistent listeners Map shared across all useEventBus() calls
const globalListeners = new Map<CombatEngineEventType, Set<EventHandler<CombatEngineEventType>>>();

export const useEventBus = () => {
  const on = <T extends CombatEngineEventType>(event: T, handler: EventHandler<T>) => {
    if (!globalListeners.has(event)) globalListeners.set(event, new Set());
    globalListeners.get(event)!.add(handler as EventHandler<CombatEngineEventType>);
  };

  const off = <T extends CombatEngineEventType>(event: T, handler: EventHandler<T>) => {
    globalListeners.get(event)?.delete(handler as EventHandler<CombatEngineEventType>);
  };

  const emit = <T extends CombatEngineEventType>(
    event: T,
    payload: CombatEngineEventPayload[T],
  ) => {
    globalListeners.get(event)?.forEach(h => h(payload));
  };

  return { on, off, emit };
};
