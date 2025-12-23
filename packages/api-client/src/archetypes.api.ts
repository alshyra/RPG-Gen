import { useQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { apiClient } from "./index.js";

const archetypesApi = {
  async getAllArchetypes() {
    const response = await apiClient.GET("/api/archetypes");
    return response.data;
  },
  async getArchetype(archetypeName: string) {
    const response = await apiClient.GET("/api/archetypes/{archetypeName}", {
      params: { path: { archetypeName } },
    });
    return response.data;
  },
  async getTalentTrees(archetypeName: string) {
    const response = await apiClient.GET("/api/archetypes/{archetypeName}/talent-trees", {
      params: { path: { archetypeName } },
    });
    return response.data;
  },
  async getStartingAptitudes(archetypeName: string) {
    const response = await apiClient.GET("/api/archetypes/{archetypeName}/starting-aptitudes", {
      params: { path: { archetypeName } },
    });
    return response.data;
  },
};

const archetypesKeys = {
  all: () => ["archetypes"] as const,
  byName: (archetypeName: string) => ["archetypes", archetypeName] as const,
  talentTrees: (archetypeName: string) => ["archetypes", archetypeName, "talent-trees"] as const,
  aptitudes: (archetypeName: string) => ["archetypes", archetypeName, "aptitudes"] as const,
};

export function useArchetypes(
  archetypeName?: MaybeRefOrGetter<string | undefined>,
  options?: { enabled?: boolean },
) {
  const computedArchetypeName = computed(() => toValue(archetypeName));

  const allArchetypes = useQuery({
    queryKey: archetypesKeys.all(),
    queryFn: archetypesApi.getAllArchetypes,
    enabled: computed(() => options?.enabled !== false),
  });

  const archetypeDetails = useQuery({
    queryKey: computed(() => {
      const a = computedArchetypeName.value;
      return a ? archetypesKeys.byName(a) : ["archetypes"];
    }),
    queryFn: async () => {
      const a = computedArchetypeName.value;
      if (!a) throw new Error("Archetype name is required");
      return archetypesApi.getArchetype(a);
    },
    enabled: computed(() => {
      const a = computedArchetypeName.value;
      return options?.enabled !== false && !!a;
    }),
  });

  const talentTrees = useQuery({
    queryKey: computed(() => {
      const a = computedArchetypeName.value;
      return a ? archetypesKeys.talentTrees(a) : ["archetypes"];
    }),
    queryFn: async () => {
      const a = computedArchetypeName.value;
      if (!a) throw new Error("Archetype name is required");
      return archetypesApi.getTalentTrees(a);
    },
    enabled: computed(() => {
      const a = computedArchetypeName.value;
      return options?.enabled !== false && !!a;
    }),
  });

  return {
    allArchetypes,
    archetypeDetails,
    talentTrees,
  };
}
