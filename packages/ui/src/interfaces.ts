// UI component interfaces

export interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title?: string;
  message: string;
  _resolve?: (value?: unknown) => void;
}

export interface UiModalProps {
  isOpen: boolean;
  title?: string;
}

export interface UiModalEmits {
  (e: 'close'): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

export interface UiButtonOption {
  label?: string;
  value: string | number;
}
