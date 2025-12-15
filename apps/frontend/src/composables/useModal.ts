import { reactive } from "vue";
import type { ModalState } from "@/interfaces";

const state = reactive<ModalState>({
  isOpen: false,
  type: "alert",
  title: undefined,
  message: "",
});

export function useModalState() {
  return state;
}

export function showAlert(message: string, title?: string): Promise<void> {
  return new Promise<void>(resolve => {
    state.type = "alert";
    state.title = title;
    state.message = message;
    state.isOpen = true;
    state._resolve = () => {
      resolve();
      // cleanup
      state.isOpen = false;
      state._resolve = undefined;
    };
  });
}

export function showConfirm(message: string, title?: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    state.type = "confirm";
    state.title = title;
    state.message = message;
    state.isOpen = true;
    state._resolve = (val?: unknown) => {
      resolve(Boolean(val));
      state.isOpen = false;
      state._resolve = undefined;
    };
  });
}

export function _resolveModal(value?: unknown) {
  if (state._resolve) state._resolve(value);
}
