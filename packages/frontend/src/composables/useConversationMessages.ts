import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameMessage } from '@rpg/shared';

export const useConversationMessages = defineStore('conversation', () => {
  const messages = ref<GameMessage[]>([]);
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null);
  const actions = {
    appendMessage: (role: string, text: string) => {
      messages.value.push({ role, text });
    },
    updateMessages: (newMessages: GameMessage[]) => {
      messages.value = newMessages;
    },
    clearMessages: () => {
      messages.value = [];
    },
    popLastMessage: () => {
      messages.value.pop();
    },
  };

  return {
    messages,
    lastMessage,
    ...actions,
  };
});
