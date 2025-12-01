import type { GameInstructionDto } from '@rpg-gen/shared';

interface RollSubmitPayload {
  instructions: {
    type: string;
    dices: string;
    modifier: number;
    description: string;
  }[];
}

interface RollSubmitResponse {
  pendingRolls?: GameInstructionDto[];
}

/**
 * Parse response and filter for valid instruction objects using type guard pattern.
 */
function parseRollResponse(data: unknown): RollSubmitResponse | null {
  if (!data || typeof data !== 'object') return null;
  const responseObj = data as Record<string, unknown>;
  if (!Array.isArray(responseObj.pendingRolls)) {
    return { pendingRolls: undefined };
  }
  const pendingRolls = responseObj.pendingRolls.filter(
    (item): item is GameInstructionDto => item !== null && typeof item === 'object' && 'type' in item,
  );
  return { pendingRolls };
}

class RollsService {
  /**
   * Submit roll instruction(s) directly (not via /chat).
   * Uses direct fetch because the generated OpenAPI types are incorrect
   * (Record<string, never>[] instead of actual instruction types).
   */
  async submitRoll(characterId: string, payload: RollSubmitPayload): Promise<RollSubmitResponse | null> {
    const response = await fetch(`/api/rolls/${encodeURIComponent(characterId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Roll submission failed: ${response.status}`);
    }
    const data: unknown = await response.json();
    return parseRollResponse(data);
  }
}

export const rollsService = new RollsService();
