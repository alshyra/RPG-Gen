import type {
  CombatEngineEventType,
  CombatEngineEventPayload,
  EventHandler,
} from '@/types/combat-types';

export const useEventBus = () => {
  // Simple singleton event bus (lightweight)
  const listeners = new Map<CombatEngineEventType, Set<EventHandler<CombatEngineEventType>>>();

  const on = <T extends CombatEngineEventType>(event: T, handler: EventHandler<T>) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler as EventHandler<CombatEngineEventType>);
  };

  const off = <T extends CombatEngineEventType>(event: T, handler: EventHandler<T>) => {
    listeners.get(event)?.delete(handler as EventHandler<CombatEngineEventType>);
  };

  const emit = <T extends CombatEngineEventType>(
    event: T,
    payload: CombatEngineEventPayload[T],
  ) => {
    listeners.get(event)?.forEach(h => h(payload));
  };

  return { on, off, emit };
}

