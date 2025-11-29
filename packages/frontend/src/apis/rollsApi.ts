import { api } from './apiClient';

const getData = <T>(response: { data?: T; error?: unknown }): T => {
  if (response.error) throw response.error;
  return response.data as T;
};

class RollsService {
  /**
   * Submit roll instruction(s) directly (not via /chat)
   */
  async submitRoll(characterId: string, payload: { instructions: any[] }) {
    const response = await api.POST('/api/rolls/{characterId}', {
      params: { path: { characterId } },
      body: payload,
    });
    return getData<any>(response);
  }
}

export const rollsService = new RollsService();
