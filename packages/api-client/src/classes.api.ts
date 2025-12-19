import { useQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { apiClient } from "./index.js";

const classesApi = {
  async getAllClasses() {
    const response = await apiClient.GET("/api/classes");
    return response.data;
  },
  async getClass(className: string) {
    const response = await apiClient.GET("/api/classes/{className}", {
      params: { path: { className } },
    });
    return response.data;
  },
  async getTalentTrees(className: string) {
    const response = await apiClient.GET("/api/classes/{className}/voies", {
      params: { path: { className } },
    });
    return response.data;
  },
  async getStartingAptitudes(className: string) {
    const response = await apiClient.GET("/api/classes/{className}/starting-aptitudes", {
      params: { path: { className } },
    });
    return response.data;
  },
};

const classesKeys = {
  all: () => ["classes"] as const,
  byName: (className: string) => ["classes", className] as const,
  voies: (className: string) => ["classes", className, "voies"] as const,
  aptitudes: (className: string) => ["classes", className, "aptitudes"] as const,
};

export function useClasses(
  className?: MaybeRefOrGetter<string | undefined>,
  options?: { enabled?: boolean },
) {
  const computedClassName = computed(() => toValue(className));

  const allClasses = useQuery({
    queryKey: classesKeys.all(),
    queryFn: classesApi.getAllClasses,
    enabled: computed(() => options?.enabled !== false),
  });

  const classDetails = useQuery({
    queryKey: computed(() => {
      const c = computedClassName.value;
      return c ? classesKeys.byName(c) : ["classes"];
    }),
    queryFn: async () => {
      const c = computedClassName.value;
      if (!c) throw new Error("Class name is required");
      return classesApi.getClass(c);
    },
    enabled: computed(() => {
      const c = computedClassName.value;
      return options?.enabled !== false && !!c;
    }),
  });

  const talentTrees = useQuery({
    queryKey: computed(() => {
      const c = computedClassName.value;
      return c ? classesKeys.voies(c) : ["classes"];
    }),
    queryFn: async () => {
      const c = computedClassName.value;
      if (!c) throw new Error("Class name is required");
      return classesApi.getTalentTrees(c);
    },
    enabled: computed(() => {
      const c = computedClassName.value;
      return options?.enabled !== false && !!c;
    }),
  });

  return {
    allClasses,
    classDetails,
    talentTrees,
  };
}
