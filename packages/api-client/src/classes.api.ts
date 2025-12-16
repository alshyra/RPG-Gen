import type { LevelUpOptionsDto } from "@rpg-gen/shared";
import type { MaybeRefOrGetter } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { computed, toValue } from "vue";
import { apiClient, getData } from "./index.js";

// Exported temporarily for legacy code - prefer using useClasses()
export const classesApi = {
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
  const queryClient = useQueryClient();
  const cls = computed(() => toValue(className));
  const lvl = computed(() => toValue(level));

  const levelOptions = useQuery({
    queryKey: computed(() => {
      const c = cls.value;
      const l = lvl.value;
      return c && l ? classesKeys.levelOptions(c, l) : ["classes"];
    }),
    queryFn: async () => {
      const c = cls.value;
      const l = lvl.value;
      if (!c || !l) throw new Error("Class name and level are required");
      return classesApi.getLevelOptions(c, l);
    },
    enabled: computed(() => {
      const c = cls.value;
      const l = lvl.value;
      return options?.enabled !== false && !!c && !!l;
    }),
  });

  return {
    levelOptions,
  };
}
