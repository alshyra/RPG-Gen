import { useQuery } from "@tanstack/vue-query";
import { apiClient } from "./client.js";

// API functions
async function getAllAptitudes() {
  const res = await apiClient.GET("/api/aptitudes");
  if (!res.data) throw new Error("No data received for aptitudes");
  return res.data;
}

// Vue Query hooks
export function useAptitudes() {
  return useQuery({
    queryKey: ["aptitudes"],
    queryFn: getAllAptitudes,
    staleTime: 1000 * 60 * 60, // 1 hour - aptitudes don't change often
  });
}
