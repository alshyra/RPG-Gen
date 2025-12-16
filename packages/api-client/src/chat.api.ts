import type { ChatMessageDto } from "@rpg-gen/shared";
import { useMutation, useQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { toValue, computed } from "vue";
import { apiClient, getData } from "./index.js";

// Query keys factory
export const chatKeys = {
  all: ["chat"] as const,
  history: (characterId: string) => [...chatKeys.all, "history", characterId] as const,
};

// Exported temporarily for legacy code - prefer using useChat()
export const chatApi = {
  async sendMessage(characterId: string, message: ChatMessageDto): Promise<ChatMessageDto> {
    const response = await apiClient.POST("/api/chat/{characterId}", {
      params: { path: { characterId } },
      body: message,
    });
    return getData(response);
  },

  async getHistory(characterId: string): Promise<ChatMessageDto[]> {
    const response = await apiClient.GET("/api/chat/{characterId}/history", {
      params: { path: { characterId } },
    });
    return getData(response);
  },
};

/**
 * Vue Query wrapper for chat operations
 * @param characterId - Character ID (can be ref or getter)
 */
export function useChat(
  characterId: MaybeRefOrGetter<string | undefined>,
  options?: {
    enabled?: boolean;
  },
) {
  const id = computed(() => toValue(characterId));

  // Query: Get chat history
  const history = useQuery({
    queryKey: computed(() => chatKeys.history(id.value!)),
    queryFn: async () => {
      if (!id.value) throw new Error("Character ID is required");
      return chatApi.getHistory(id.value);
    },
    enabled: computed(() => options?.enabled ?? !!id.value),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Mutation: Send message
  const sendMessage = useMutation({
    mutationFn: async (message: ChatMessageDto) => {
      if (!id.value) throw new Error("Character ID is required");
      return chatApi.sendMessage(id.value, message);
    },
  });

  return {
    // Query
    history,

    // Mutations
    sendMessage,

    // Helpers
    isLoading: computed(() => history.isLoading.value),
  };
}
