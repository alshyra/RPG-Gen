import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed } from "vue";
import { apiClient } from "./client.js";

// API functions
async function getAvailableClasses() {
  const res = await apiClient.GET("/api/progression/classes");
  return res.data;
}

async function getAvailableRaces() {
  const res = await apiClient.GET("/api/progression/races");
  return res.data;
}

async function getTalentTrees(className: string) {
  const res = await apiClient.GET(`/api/classes/{className}/voies`, {
    params: {
      query: {
        className,
      }
    }
  });
  return res.data;
}

async function selectClass(
  characterId: string,
  className: string,
) {
  const res = await apiClient.POST(`/api/progression/{characterId}/select-class`, {
    params: { characterId },
    body: { className},
  });
  return res.data;
}

async function unlockRank(
  characterId: string,
  voieId: string,
  rank: number,
): Promise<unknown> {
  const res = await apiClient.post(`/progression/${characterId}/unlock-rank`, {
    voieId,
    rank,
  });
  return res.data;
}

async function selectRace(
  characterId: string,
  raceId: string,
): Promise<unknown> {
  const res = await apiClient.post(`/progression/${characterId}/select-race`, {
    raceId,
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

export function useTalentTrees(classNameOrRef: string | { value: string }) {
  const getClassName = () => {
    if (typeof classNameOrRef === 'string') return classNameOrRef;
    return classNameOrRef.value;
  };
  
  return useQuery({
    queryKey: computed(() => ["classes", getClassName(), "voies"]),
    queryFn: () => getTalentTrees(getClassName()),
    enabled: computed(() => !!getClassName()),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSelectClass(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (className: string) => selectClass(characterId, className),
    onSuccess: () => {
      // Invalidate character query to refresh data
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}

export function useSelectRace(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (raceId: string) => selectRace(characterId, raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}

export function useUnlockRank(characterId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ voieId, rank }: { voieId: string; rank: number }) =>
      unlockRank(characterId, voieId, rank),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}
