import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { defineStore } from 'pinia';
// gameEngine is used in services instead of directly in the composable
import type { GameMessage } from '@rpg/shared';
import { processGameInstructions } from '@/services/instructions.service';
import { sendGameMessage } from '@/services/game-message.service';

export const useConversation = defineStore('conversation', () => {
  // composable-to-composable imports removed: heavy logic (store updates) happen
  // in services, which import the stores. This keeps composables decoupled.
  const router = useRouter();
  const currentCharacterId = computed(() => router.currentRoute.value.params.characterId as string);

  const messages = ref<GameMessage[]>([]);
  const lastMessage = computed(() => messages.value[messages.value.length - 1] || null);
  const appendMessage = (role: string, text: string) => messages.value.push({ role, text });
  const updateMessages = (newMessages: GameMessage[]) => (messages.value = newMessages);
  const clearMessages = () => (messages.value = []);
  const popLastMessage = () => messages.value.pop();

  const processInstructions = (instructions: any[] = []) => processGameInstructions(instructions, appendMessage);

  const sendMessage = async (): Promise<void> => {
    await sendGameMessage(currentCharacterId.value, appendMessage, processInstructions);
  };

  return {
    messages,
    lastMessage,
    appendMessage,
    updateMessages,
    clearMessages,
    popLastMessage,
    sendMessage,
    processInstructions,
  };
});
