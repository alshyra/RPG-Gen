import type {
  CharacterResponseDto,
  CreateCharacterBodyDto,
  UpdateCharacterRequestDto,
  KillCharacterBodyDto,
  CreateInventoryItemDto,
  EquipInventoryDto,
  RemoveInventoryBodyDto,
  GrantInspirationBodyDto,
  InspirationResponseDto,
  LevelUpApplyDto,
  DeceasedCharacterResponseDto,
} from "@rpg-gen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { toValue, computed } from "vue";
import { apiClient, getData } from "./index.js";

// Query keys factory
export const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  deceased: () => [...characterKeys.all, "deceased"] as const,
  details: () => [...characterKeys.all, "detail"] as const,
  detail: (id: string) => [...characterKeys.details(), id] as const,
};

// Internal API functions (private - use useCharacter() hook)
const characterApi = {
  async create(body: CreateCharacterBodyDto): Promise<CharacterResponseDto> {
    const response = await apiClient.POST("/api/characters", { body });
    return getData(response);
  },

  async findAll(): Promise<CharacterResponseDto[]> {
    const response = await apiClient.GET("/api/characters");
    return getData(response);
  },

  async getDeceased(): Promise<DeceasedCharacterResponseDto[]> {
    const response = await apiClient.GET("/api/characters/deceased");
    return getData(response);
  },

  async findOne(characterId: string): Promise<CharacterResponseDto> {
    const response = await apiClient.GET("/api/characters/{characterId}", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  async update(
    characterId: string,
    body: UpdateCharacterRequestDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.PUT("/api/characters/{characterId}", {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  async delete(characterId: string): Promise<object> {
    const response = await apiClient.DELETE("/api/characters/{characterId}", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  async kill(characterId: string, body: KillCharacterBodyDto): Promise<CharacterResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/kill", {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  async addInventory(
    characterId: string,
    item: CreateInventoryItemDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/inventory", {
      params: { path: { characterId } },
      body: item,
    });
    return getData(response);
  },

  async updateInventory(
    characterId: string,
    itemId: string,
    item: CreateInventoryItemDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.PATCH("/api/characters/{characterId}/inventory/{itemId}", {
      params: { path: { characterId, itemId } },
      body: item,
    });
    return getData(response);
  },

  async removeInventory(
    characterId: string,
    itemId: string,
    body: RemoveInventoryBodyDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.DELETE("/api/characters/{characterId}/inventory/{itemId}", {
      params: { path: { characterId, itemId } },
      body,
    });
    return getData(response);
  },

  async equipItem(characterId: string, body: EquipInventoryDto): Promise<CharacterResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/inventory/equip", {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  async grantInspiration(
    characterId: string,
    body: GrantInspirationBodyDto,
  ): Promise<InspirationResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/inspiration/grant", {
      params: { path: { characterId } },
      body,
    });
    return getData(response);
  },

  async spendInspiration(characterId: string): Promise<InspirationResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/inspiration/spend", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  async applyLevelUp(
    characterId: string,
    className: string,
    body: LevelUpApplyDto,
  ): Promise<CharacterResponseDto> {
    const response = await apiClient.POST("/api/characters/{characterId}/levelup/{className}", {
      params: { path: { characterId, className } },
      body,
    });
    return getData(response);
  },
};

/**
 * Vue Query wrapper for character operations
 * @param characterId - Character ID (can be ref or getter)
 * @param options - Query options
 */
export function useCharacter(
  characterId: MaybeRefOrGetter<string | undefined>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  const queryClient = useQueryClient();
  const id = computed(() => toValue(characterId));

  // Query: Get character
  const character = useQuery({
    queryKey: computed(() => characterKeys.detail(id.value!)),
    queryFn: async () => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.findOne(id.value);
    },
    enabled: computed(() => options?.enabled ?? !!id.value),
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes default
  });

  // Mutation: Create character
  const create = useMutation({
    mutationFn: async (data: CreateCharacterBodyDto) => characterApi.create(data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
      if (data.characterId) {
        queryClient.setQueryData(characterKeys.detail(data.characterId), data);
      }
    },
  });

  // Mutation: Update character
  const update = useMutation({
    mutationFn: async (data: UpdateCharacterRequestDto) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.update(id.value, data);
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });

  // Mutation: Delete character
  const deleteCharacter = useMutation({
    mutationFn: async () => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.delete(id.value);
    },
    onSuccess: () => {
      if (!id.value) return;
      queryClient.removeQueries({ queryKey: characterKeys.detail(id.value) });
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });

  // Mutation: Update HP with optimistic update
  const updateHp = useMutation({
    mutationFn: async (hp: number) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.update(id.value, { hp });
    },
    onMutate: async hp => {
      if (!id.value) return;
      await queryClient.cancelQueries({ queryKey: characterKeys.detail(id.value) });
      const previous = queryClient.getQueryData<CharacterResponseDto>(
        characterKeys.detail(id.value),
      );
      if (previous) {
        queryClient.setQueryData<CharacterResponseDto>(characterKeys.detail(id.value), {
          ...previous,
          hp,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (!id.value || !context?.previous) return;
      queryClient.setQueryData(characterKeys.detail(id.value), context.previous);
    },
    onSettled: () => {
      if (!id.value) return;
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Update XP with optimistic update
  const updateXp = useMutation({
    mutationFn: async (xp: number) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.update(id.value, { totalXp: xp });
    },
    onMutate: async xp => {
      if (!id.value) return;
      await queryClient.cancelQueries({ queryKey: characterKeys.detail(id.value) });
      const previous = queryClient.getQueryData<CharacterResponseDto>(
        characterKeys.detail(id.value),
      );
      if (previous) {
        queryClient.setQueryData<CharacterResponseDto>(characterKeys.detail(id.value), {
          ...previous,
          totalXp: xp,
        });
      }
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (!id.value || !context?.previous) return;
      queryClient.setQueryData(characterKeys.detail(id.value), context.previous);
    },
    onSettled: () => {
      if (!id.value) return;
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Add inventory item
  const addInventory = useMutation({
    mutationFn: async (item: CreateInventoryItemDto) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.addInventory(id.value, item);
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Remove inventory item
  const removeInventory = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.removeInventory(id.value, itemId, { qty });
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Update inventory item
  const updateInventory = useMutation({
    mutationFn: async ({ itemId, item }: { itemId: string; item: CreateInventoryItemDto }) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.updateInventory(id.value, itemId, item);
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Equip item
  const equipItem = useMutation({
    mutationFn: async (body: EquipInventoryDto) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.equipItem(id.value, body);
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Grant inspiration
  const grantInspiration = useMutation({
    mutationFn: async (amount: number) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.grantInspiration(id.value, { amount });
    },
    onSuccess: data => {
      if (!id.value) return;
      if (data.character) {
        queryClient.setQueryData(characterKeys.detail(id.value), data.character);
      }
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Spend inspiration
  const spendInspiration = useMutation({
    mutationFn: async () => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.spendInspiration(id.value);
    },
    onSuccess: data => {
      if (!id.value) return;
      if (data.character) {
        queryClient.setQueryData(characterKeys.detail(id.value), data.character);
      }
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  // Mutation: Kill character
  const kill = useMutation({
    mutationFn: async (body: KillCharacterBodyDto) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.kill(id.value, body);
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.all });
    },
  });

  // Mutation: Apply level up
  const applyLevelUp = useMutation({
    mutationFn: async ({ className, body }: { className: string; body: LevelUpApplyDto }) => {
      if (!id.value) throw new Error("Character ID is required");
      return characterApi.applyLevelUp(id.value, className, body);
    },
    onSuccess: data => {
      if (!id.value) return;
      queryClient.setQueryData(characterKeys.detail(id.value), data);
      queryClient.invalidateQueries({ queryKey: characterKeys.detail(id.value) });
    },
  });

  return {
    // Query object (access data via character.data.value)
    character,

    // Mutations
    create,
    update,
    deleteCharacter,
    updateHp,
    updateXp,
    addInventory,
    removeInventory,
    updateInventory,
    equipItem,
    grantInspiration,
    spendInspiration,
    kill,
    applyLevelUp,

    // Helpers
    isLoading: computed(() => character.isLoading.value),
    isError: computed(() => character.isError.value),
    isDead: computed(() => (character.data.value?.hp ?? 1) <= 0),
  };
}

/**
 * Query for all characters list
 */
export function useCharactersList() {
  return useQuery({
    queryKey: characterKeys.lists(),
    queryFn: () => characterApi.findAll(),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Query for deceased characters
 */
export function useDeceasedCharacters() {
  return useQuery({
    queryKey: characterKeys.deceased(),
    queryFn: () => characterApi.getDeceased(),
    staleTime: 1000 * 60, // 1 minute
  });
}
