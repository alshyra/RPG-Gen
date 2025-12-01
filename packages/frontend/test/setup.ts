import 'whatwg-fetch';
import { vi } from 'vitest';
import { reactive } from 'vue';

let shouldMockLocalStorage = true;
try {
  if (typeof globalThis.localStorage !== 'undefined') shouldMockLocalStorage = false;
} catch {
  shouldMockLocalStorage = true;
}

if (shouldMockLocalStorage) {
  const storage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => (Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null),
    setItem: (key: string, value: string) => {
      storage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage)
        .forEach(k => delete storage[k]);
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
    get length() {
      return Object.keys(storage).length;
    },
  };
}

// Basic matchMedia stub
if (typeof window !== 'undefined' && !window.matchMedia) {
  (window as any).matchMedia = function matchMedia() {
    return {
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

// Ensure window.URLSearchParams exists
if (typeof window !== 'undefined' && !window.URLSearchParams) {
  (window).URLSearchParams = globalThis.URLSearchParams;
}

// Mock vue-router composables to avoid `useRoute()` failures in tests
vi.mock('vue-router', () => {
  const route = reactive({ params: {} });
  return {
    useRoute: () => route,
    useRouter: () => ({ push: () => {} }),
    RouterLink: {},
  };
});
