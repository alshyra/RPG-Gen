import { conversationService } from '@/services/conversationService';
import type { GameMessage } from '@rpg/shared';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

export const useConversationStore = defineStore('conversation', () => {
  const router = useRouter();
  const currentCharacterId = computed(() => router.currentRoute.value.params.characterId as string);

  const messages = ref<[]>([]);
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null);
  const appendMessage = (role: string, text: string) => {
    messages.value.push({ role, text });
    conversationService.sendMessage(currentCharacterId.value, text);
  };
  const clearMessages = () => (messages.value = []);

  const fetchConversationByCharacterId = async () =>
    conversationService.getConversationById(currentCharacterId.value);

  watch(currentCharacterId, () => {
    clearMessages();
    fetchConversationByCharacterId();
  });
  return {
    messages,
    lastMessage,
    appendMessage,
    clearMessages,
  };
});
