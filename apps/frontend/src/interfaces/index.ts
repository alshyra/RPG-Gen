// Centralized frontend interfaces

// Combat-related
export interface AttackQueueItem {
  result: import('@rpg-gen/shared').CombatActionResponseDto;
  isPlayerAttack: boolean;
}

export interface AttackView {
  attacker?: string;
  attackerId?: string;
  target?: string;
  targetId?: string;
  hit?: boolean;
  damageRoll?: number[];
  damageBonus?: number;
  totalDamage?: number;
  critical?: boolean;
  targetHpBefore?: number;
  targetHpAfter?: number;
  targetDefeated?: boolean;
}

// Modal / UI
export interface ModalState {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title?: string;
  message: string;
  _resolve?: (value?: unknown) => void;
}

export interface RollModalData {
  diceNotation?: string;
  rolls?: number[];
  bonus?: number | null;
  total?: number | null;
  skillName?: string;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  keptRoll?: number | null;
  discardedRoll?: number | null;
  action?: string;
  target?: string;
  targetAc?: number | null;
  show?: boolean;
}

// Character UI small interfaces
export interface HpObject {
  current?: number;
  max?: number;
}

export interface InventoryItemForUi {
  meta?: {
    class?: string;
    type?: string;
    ac?: string | number;
  };
}

export interface CommandSuggestionsProps {
  inputText: string;
}

export interface UiButtonOption {
  label?: string;
  value: string | number;
}

export interface DeathModalProps {
  isOpen: boolean;
}

export interface DeathModalEmits {
  confirm: [];
  close: [];
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

// Game session messages
export interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  narrative: string;
  timestamp?: number;
  instructions?:
    | import('@rpg-gen/shared').GameInstructionDto
    | import('@rpg-gen/shared').GameInstructionDto[];
}
export interface ProcessedMessage {
  role: 'user' | 'assistant' | 'system';
  narrative: string;
}

// Chat command utilities (copied from utils/chatCommands)
export type CommandType = 'cast' | 'equip' | 'attack' | 'use';
export interface ParsedCommand {
  type: CommandType;
  target: string;
}
export interface CommandDefinition {
  command: CommandType;
  description: string;
  usage: string;
}
export interface ArgumentSuggestion {
  name: string;
  description?: string;
  type: 'spell' | 'item' | 'target';
}
export type SuggestionType = 'command' | 'argument';
export interface SuggestionResult {
  type: SuggestionType;
  commandSuggestions: CommandDefinition[];
  argumentSuggestions: ArgumentSuggestion[];
  activeCommand?: CommandType;
}

// Skill helpers used by services
export interface SkillEntry {
  name?: string;
  proficient?: boolean;
  modifier?: number;
}

export interface LevelUpResult {
  success: boolean;
  newLevel: number;
  hpGain: number;
  hasASI: boolean;
  newFeatures: string[];
  proficiencyBonus: number;
  message: string;
}

export interface ClassLevelUpRules {
  hpDie: number;
  proficiencyProgression: number[];
  asiLevels: number[];
  features: Record<number, string[]>;
}

export interface SkillRule {
  name: string;
  ability: 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha';
}
