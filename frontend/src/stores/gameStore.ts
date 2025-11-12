import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CharacterEntry } from '../services/characterService';
import { GameInstruction } from '../services/gameEngine';

export interface GameMessage {
  role: string;
  text: string;
}

export interface GameSession {
  world: string;
  worldName: string;
  character: CharacterEntry | null;
}

export const useGameStore = defineStore('game', () => {
  // Session state
  const session = ref<GameSession>({
    world: '',
    worldName: '—',
    character: null,
  });

  // Chat state
  const messages = ref<GameMessage[]>([]);
  const playerText = ref('');
  const isInitializing = ref(false);
  const isSending = ref(false);

  // Game state
  const pendingInstruction = ref<GameInstruction | null>(null);
  const showRollModal = ref(false);
  const showDeathModal = ref(false);

  // Computed properties
  const charHpMax = computed(() => session.value.character?.hpMax || 12);
  const isDead = computed(() => (session.value.character?.hp || 0) === 0);
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null);

  // Actions
  function setWorld(world: string, name: string) {
    session.value.world = world;
    session.value.worldName = name;
  }

  function setCharacter(character: CharacterEntry | null) {
    session.value.character = character;
  }

  function appendMessage(role: string, text: string) {
    messages.value.push({ role, text });
  }

  function updateMessages(newMessages: GameMessage[]) {
    messages.value = newMessages;
  }

  function clearMessages() {
    messages.value = [];
  }

  function setPlayerText(text: string) {
    playerText.value = text;
  }

  function clearPlayerText() {
    playerText.value = '';
  }

  function updateCharacterHp(delta: number) {
    if (!session.value.character) return;
    const newHp = Math.max(0, Math.min(charHpMax.value, session.value.character.hp + delta));
    session.value.character.hp = newHp;
  }

  function updateCharacterXp(delta: number) {
    if (!session.value.character) return;
    session.value.character.totalXp = (session.value.character.totalXp || 0) + delta;
  }

  function setPendingInstruction(instruction: GameInstruction | null) {
    pendingInstruction.value = instruction;
  }

  function setInitializing(value: boolean) {
    isInitializing.value = value;
  }

  function setSending(value: boolean) {
    isSending.value = value;
  }

  function setRollModalVisible(value: boolean) {
    showRollModal.value = value;
  }

  function setDeathModalVisible(value: boolean) {
    showDeathModal.value = value;
  }

  function reset() {
    messages.value = [];
    playerText.value = '';
    pendingInstruction.value = null;
    showRollModal.value = false;
    showDeathModal.value = false;
  }

  return {
    // State
    session,
    messages,
    playerText,
    isInitializing,
    isSending,
    pendingInstruction,
    showRollModal,
    showDeathModal,

    // Computed
    charHpMax,
    isDead,
    lastMessage,

    // Actions
    setWorld,
    setCharacter,
    appendMessage,
    updateMessages,
    clearMessages,
    setPlayerText,
    clearPlayerText,
    updateCharacterHp,
    updateCharacterXp,
    setPendingInstruction,
    setInitializing,
    setSending,
    setRollModalVisible,
    setDeathModalVisible,
    reset,
  };
});
