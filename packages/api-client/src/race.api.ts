import { useQuery } from "@tanstack/vue-query";
import { apiClient } from "./client";

async function getAvailableRaces() {
  const res = await apiClient.GET("/api/races");
  if (!res.data) throw new Error("No data received");
  return res.data;
}

export const useAvailableRaces = useQuery({
  queryKey: ["races"],
  queryFn: getAvailableRaces,
});