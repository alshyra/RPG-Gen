import { useQuery } from "@tanstack/vue-query";
import { apiClient } from "./client";

async function getAvailableRaces() {
  const res = await apiClient.GET("/api/game-data/races", {});
  if (!res.data) throw new Error("No data received");
  return res.data;
}

export function useAvailableRaces() {
  return useQuery({
    queryKey: ["races"],
    queryFn: getAvailableRaces,
  });
}