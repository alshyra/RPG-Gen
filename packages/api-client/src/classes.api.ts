import type { LevelUpOptionsDto } from "@rpg-gen/shared";
import { useQuery } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { apiClient, getData } from "./index.js";

const classesApi = {
  async getLevelOptions(className: string, level: number): Promise<LevelUpOptionsDto> {
    const response = await apiClient.GET("/api/classes/{className}/levels/{level}", {
      params: { path: { className, level } },
    });
    return getData(response);
  },
};

const classesKeys = {
  levelOptions: (className: string, level: number) =>
    ["classes", className, "levels", level] as const,
};

export function useClasses(
  className: MaybeRefOrGetter<string | undefined>,
  level: MaybeRefOrGetter<number | undefined>,
  options?: { enabled?: boolean },
) {
  const computedClassName = computed(() => toValue(className));
  const currentLevelValue = computed(() => toValue(level));

  const levelOptions = useQuery({
    queryKey: computed(() => {
      const c = computedClassName.value;
      const l = currentLevelValue.value;
      return c && l ? classesKeys.levelOptions(c, l) : ["classes"];
    }),
    queryFn: async () => {
      const c = computedClassName.value;
      const l = currentLevelValue.value;
      if (!c || !l) throw new Error("Class name and level are required");
      return classesApi.getLevelOptions(c, l);
    },
    enabled: computed(() => {
      const c = computedClassName.value;
      const l = currentLevelValue.value;
      return options?.enabled !== false && !!c && !!l;
    }),
  });

  return {
    levelOptions,
  };
}
