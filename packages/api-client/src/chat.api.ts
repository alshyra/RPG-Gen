import type { ConversationResponseDto, NarrativeResponseDto } from "@rpg-gen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { toValue, computed } from "vue";
import { apiClient, getData } from "./index.js";

// Query keys factory
export const chatKeys = {
  all: ["chat"] as const,
  history: (characterId: string) => [...chatKeys.all, "history", characterId] as const,
  messages: (characterId: string) => [...chatKeys.all, "messages", characterId] as const,
};

// Internal API functions (private - use useChat() hook)
const chatApi = {
  async sendMessage(characterId: string, message: string): Promise<NarrativeResponseDto> {
    const response = await apiClient.POST("/api/chat/{characterId}", {
      params: { path: { characterId } },
      body: { message },
    });
    return getData(response);
  },

  async getHistory(characterId: string): Promise<ConversationResponseDto> {
    const response = await apiClient.GET("/api/chat/{characterId}/history", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  async getRecentMessages(characterId: string): Promise<NarrativeResponseDto[]> {
    const response = await apiClient.GET("/api/chat/{characterId}/messages", {
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
  const queryClient = useQueryClient();

  // Query: Get chat history (full conversation)
  const history = useQuery({
    queryKey: computed(() => chatKeys.history(id.value!)),
    queryFn: async () => {
      if (!id.value) throw new Error("Character ID is required");
      return chatApi.getHistory(id.value);
    },
    enabled: computed(() => options?.enabled ?? !!id.value),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Query: Get recent messages only
  const recentMessages = useQuery({
    queryKey: computed(() => chatKeys.messages(id.value!)),
    queryFn: async () => {
      if (!id.value) throw new Error("Character ID is required");
      return chatApi.getRecentMessages(id.value);
    },
    enabled: computed(() => options?.enabled ?? !!id.value),
    staleTime: 1000 * 10, // 10 seconds for recent messages
  });

  // Mutation: Send message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!id.value) throw new Error("Character ID is required");
      return chatApi.sendMessage(id.value, message);
    },
    onSuccess: () => {
      // Invalidate history to refetch after sending a message
      if (id.value) {
        void queryClient.invalidateQueries({ queryKey: chatKeys.history(id.value) });
        void queryClient.invalidateQueries({ queryKey: chatKeys.messages(id.value) });
      }
    },
  });

  return {
    // Queries
    history,
    recentMessages,

    // Mutations
    sendMessage,

    // Helpers
    isLoading: computed(() => history.isLoading.value),
    messages: computed(() => history.data.value?.messages ?? []),
  };
}
