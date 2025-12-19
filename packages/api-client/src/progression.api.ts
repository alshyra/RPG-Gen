import { ClassMetadataDto, RaceMetadataDto, SelectClassDto } from "@rpg-gen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, MaybeRefOrGetter, toValue } from "vue";
import { apiClient } from "./client.js";

type ClassName = SelectClassDto['className'];

// API functions
async function getAvailableClasses(): Promise<ClassMetadataDto[]> {
  const res = await apiClient.GET("/api/progression/classes");
  if (!res.data) throw new Error("No data received for available classes");
  return res.data;
}

async function getAvailableRaces(): Promise<RaceMetadataDto[]> {
  const res = await apiClient.GET("/api/progression/races");
  if (!res.data) throw new Error("No data received for available races");
  return res.data;
}

async function getTalentTrees(className: ClassName) {
  const res = await apiClient.GET("/api/classes/{className}/voies", {
    params: {
      path: { className },
    },
  });
  if (!res.data) throw new Error("No data received for talent trees");
  return res.data;
}

async function selectClass(
  characterId: string,
  className: ClassName,
) {
  const res = await apiClient.POST("/api/progression/{characterId}/select-class", {
    params: {
      path: { characterId },
    },
    body: {
      className,
    },
  });
  return res.data;
}

async function unlockRank(
  characterId: string,
  voieId: string,
  rank: number,
) {
  const res = await apiClient.POST("/api/progression/{characterId}/unlock-rank", {
    params: {
      path: { characterId },
    },
    body: {
      voieId,
      rank,
    },
  });
  return res.data;
}

async function selectRace(
  characterId: string,
  raceId: string,
) {
  const res = await apiClient.POST("/api/progression/{characterId}/select-race", {
    params: {
      path: { characterId },
    },
    body: {
      raceId,
    },
  });
  return res.data;
}

// Vue Query hooks
export function useAvailableClasses() {
  return useQuery({
    queryKey: ["progression", "classes"],
    queryFn: getAvailableClasses,
    staleTime: 1000 * 60 * 60, // 1 hour - classes don't change often
  });
}

export function useAvailableRaces() {
  return useQuery({
    queryKey: ["progression", "races"],
    queryFn: getAvailableRaces,
    staleTime: 1000 * 60 * 60, // 1 hour - races don't change often
  });
}

export function useTalentTrees(classNameOrRef: MaybeRefOrGetter<ClassName>) {
  const className = toValue(classNameOrRef);
  
  return useQuery({
    queryKey: computed(() => ["classes", className, "voies"]),
    queryFn: () => getTalentTrees(className),
    enabled: computed(() => !!className),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSelectClass(characterIdOrRef: MaybeRefOrGetter<string>) {
  const characterId = toValue(characterIdOrRef);
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (className: ClassName) => selectClass(characterId, className),
    onSuccess: () => {
      if (characterId) queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}

export function useSelectRace(characterIdOrRef: MaybeRefOrGetter<string | undefined>) {
  const characterId = toValue(characterIdOrRef);
  if(!characterId) {
    throw new Error("characterIdOrRef is required");
  }
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceId: string) => selectRace(characterId, raceId),
    onSuccess: () => {
      if (characterId) queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}

export function useUnlockRank(characterIdOrRef: MaybeRefOrGetter<string>) {
  const characterId = toValue(characterIdOrRef);
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ voieId, rank }: { voieId: string; rank: number }) =>
      unlockRank(characterId || '', voieId, rank),
    onSuccess: () => {
      if (characterId) queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}
