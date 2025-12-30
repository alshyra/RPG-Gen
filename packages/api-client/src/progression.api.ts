import { ClassResponseDto, RaceResponseDto, TalentTreeResponseDto, TacticalStats, UpdateCharacterRequestDto } from "@rpg-gen/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, MaybeRefOrGetter, toValue } from "vue";
import { apiClient } from "./client.js";

// Export types for components
export type ClassMetadata = ClassResponseDto;
export type RaceMetadata = RaceResponseDto;

// Type aliases for class and race values
export type ClassName = NonNullable<UpdateCharacterRequestDto["className"]>;
export type RaceId = NonNullable<UpdateCharacterRequestDto["raceId"]>;

// Types for first talent selection
export interface SelectFirstTalentParams {
  voieId: string;
  voieName: string;
  statBonus: "vigor" | "finesse" | "mind" | "survival";
}

// API functions
async function getAvailableClasses(): Promise<ClassResponseDto[]> {
  const res = await apiClient.GET("/api/classes", {});
  if (!res.data) throw new Error("No data received for available classes");
  return res.data;
}

async function getAvailableRaces(): Promise<RaceResponseDto[]> {
  const res = await apiClient.GET("/api/game-data/races", {});
  if (!res.data) throw new Error("No data received for available races");
  return res.data;
}

async function getTalentTrees(className: string): Promise<TalentTreeResponseDto[]> {
  const res = await apiClient.GET("/api/classes/{className}/talent-trees", {
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
  // Update character with the selected class using PUT /api/characters/{characterId}
  const res = await apiClient.PUT("/api/characters/{characterId}", {
    params: {
      path: { characterId },
    },
    body: {
      className,
    },
  });
  return res.data;
}

async function selectRace(
  characterId: string,
  raceId: RaceId,
) {
  // Update character with the selected race using PUT /api/characters/{characterId}
  const res = await apiClient.PUT("/api/characters/{characterId}", {
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
    queryKey: ["classes"],
    queryFn: getAvailableClasses,
    staleTime: 1000 * 60 * 60, // 1 hour - classes don't change often
  });
}

export function useAvailableRaces() {
  return useQuery({
    queryKey: ["races"],
    queryFn: getAvailableRaces,
    staleTime: 1000 * 60 * 60, // 1 hour - races don't change often
  });
}

export function useTalentTrees(classNameOrRef: MaybeRefOrGetter<string>) {
  const className = toValue(classNameOrRef);
  
  return useQuery({
    queryKey: computed(() => ["classes", className, "talent-trees"]),
    queryFn: () => getTalentTrees(className),
    enabled: computed(() => !!className),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSelectClass(characterIdOrRef: MaybeRefOrGetter<string | undefined>) {
  const characterId = toValue(characterIdOrRef);
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (className: ClassName) => selectClass(characterId || '', className),
    onSuccess: () => {
      if (characterId) void queryClient.invalidateQueries({ queryKey: ["character", characterId] });
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
    mutationFn: (raceId: RaceId) => selectRace(characterId, raceId),
    onSuccess: () => {
      if (characterId) void queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}

/**
 * Selects the first talent (voie) for a character and applies a stat bonus.
 * This is used during character creation to unlock rank 1 of a chosen voie.
 */
async function selectFirstTalent(
  characterId: string,
  params: SelectFirstTalentParams,
) {
  const { voieId, voieName, statBonus } = params;
  
  // Build the voies array with the first rank unlocked
  // Only voieId and currentRank are required - backend fills the rest
  const voies = [
    {
      voieId,
      voieName,
      currentRank: 1,
    },
  ];
  
  // Build the stats with +1 bonus to the selected stat
  // Default tactical stats start at 1 for all
  const stats: TacticalStats = {
    vigor: statBonus === "vigor" ? 2 : 1,
    finesse: statBonus === "finesse" ? 2 : 1,
    mind: statBonus === "mind" ? 2 : 1,
    survival: statBonus === "survival" ? 2 : 1,
  };
  
  const res = await apiClient.PUT("/api/characters/{characterId}", {
    params: {
      path: { characterId },
    },
    body: {
      voies,
      stats,
    },
  });
  return res.data;
}

export function useSelectFirstTalent(characterIdOrRef: MaybeRefOrGetter<string | undefined>) {
  const characterId = toValue(characterIdOrRef);
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SelectFirstTalentParams) => selectFirstTalent(characterId || '', params),
    onSuccess: () => {
      if (characterId) void queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}

// Types for unlock rank
export interface UnlockRankParams {
  voieId: string;
  rank: number;
}

/**
 * Unlocks a talent rank in a voie for a character.
 * This updates the character's voies progression.
 */
async function unlockRank(
  characterId: string,
  params: UnlockRankParams,
) {
  const { voieId, rank } = params;
  
  // Build the voies array with the new rank unlocked
  // Only voieId and currentRank are required - backend fills the rest
  const voies = [
    {
      voieId,
      currentRank: rank,
    },
  ];
  
  const res = await apiClient.PUT("/api/characters/{characterId}", {
    params: {
      path: { characterId },
    },
    body: {
      voies,
    },
  });
  return res.data;
}

export function useUnlockRank(characterIdOrRef: MaybeRefOrGetter<string | undefined>) {
  const characterId = toValue(characterIdOrRef);
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UnlockRankParams) => unlockRank(characterId || '', params),
    onSuccess: () => {
      if (characterId) void queryClient.invalidateQueries({ queryKey: ["character", characterId] });
    },
  });
}
