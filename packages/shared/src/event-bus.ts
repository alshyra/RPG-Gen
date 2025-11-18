// Minimal EventBus for cross-component notification
// The event bus is intentionally small and typed using a generic map of events
export type EventHandlers<E = any> = Map<string, Set<(payload?: E) => void>>;

const handlers: EventHandlers = new Map();

export const useEventBus = () => {
  const on = (evt: string, cb: (payload?: any) => void) => {
    if (!handlers.has(evt)) handlers.set(evt, new Set());
    handlers.get(evt)!.add(cb);
  };

  const off = (evt: string, cb?: (payload?: any) => void) => {
    if (!handlers.has(evt)) return;
    if (cb) handlers.get(evt)!.delete(cb);
    else handlers.get(evt)!.clear();
  };

  const emit = (evt: string, payload?: any) => {
    const hs = handlers.get(evt);
    if (!hs) return;
    hs.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        // swallow handler errors to avoid breaking emit flow
        // consumers should handle errors if needed
        // keep output small: no logging here
      }
    });
  };

  return { on, off, emit };
};
