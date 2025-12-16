import { useCharacter, useChat } from "@rpg-gen/api-client";
import {
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  CombatStartInstructionMessageDto,
  type GameInstructionDto,
  isRollInstruction,
  isHpInstruction,
  isXpInstruction,
  isCombatStartInstruction,
} from "@rpg-gen/shared";
import { storeToRefs } from "pinia";
import { useCombat } from "./useCombat";
import { useRoute, useRouter } from "vue-router";
import { useGameStore } from "../stores/gameStore";
import { useCurrentCharacter } from "./useCurrentCharacter";
import { useCharacterId } from "./useCharacterId";

import type { HistoryMessage, ProcessedMessage } from "@/interfaces";

type DisplayRole = "user" | "assistant" | "system";

// Type for instructions that processInstructionInMessage can handle
type ProcessableInstruction =
  | RollInstructionMessageDto
  | HpInstructionMessageDto
  | XpInstructionMessageDto
  | CombatStartInstructionMessageDto;

// Type guard to check if an instruction is processable
const isProcessableInstruction = (instr: GameInstructionDto): instr is ProcessableInstruction =>
  isRollInstruction(instr) ||
  isHpInstruction(instr) ||
  isXpInstruction(instr) ||
  isCombatStartInstruction(instr);

export const useGameSession = () => {
  const router = useRouter();
  const gameStore = useGameStore();
  const currentCharacter = useCurrentCharacter();
  const characterId = useCharacterId();
  const chat = useChat(characterId);

  const { isInitializing } = storeToRefs(gameStore);

  const { checkCombatStatus } = useCombat();

  const handleCombatStartInstruction = async (_instr: CombatStartInstructionMessageDto) => {
    try {
      const inCombat = await checkCombatStatus();
      if (inCombat) {
        gameStore.appendMessage("system", "⚔️ Combat en cours restauré.");
      } else {
        gameStore.appendMessage("system", "⚔️ Combat terminé.");
      }
    } catch {
      gameStore.appendMessage("system", "⚠️ Impossible de vérifier le statut du combat.");
    }
  };

  const processInstructionInMessage = async (
    instr: ProcessableInstruction,
    isLastMessage: boolean,
  ): Promise<void> => {
    if (isCombatStartInstruction(instr)) {
      if (isLastMessage) await handleCombatStartInstruction(instr);
      return;
    }
    if (isRollInstruction(instr)) {
      if (isLastMessage) gameStore.pendingInstruction = instr;
      const label = instr.modifierLabel ?? "";
      const value = instr.modifierValue ?? 0;
      const modDisplay = label ? ` (${label})` : value ? ` + ${value}` : "";
      gameStore.appendMessage("system", `🎲 Roll needed: ${instr.dices}${modDisplay}`);
    } else if (isXpInstruction(instr)) {
      gameStore.appendMessage("system", `✨ Gained ${instr.xp} XP`);
      if (characterId.value) {
        const character = useCharacter(characterId);
        await character.updateXp.mutateAsync(instr.xp);
      }
    } else if (isHpInstruction(instr)) {
      const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
      gameStore.appendMessage("system", `❤️ HP changed: ${hpChange}`);
      if (characterId.value) {
        const character = useCharacter(characterId);
        await character.updateHp.mutateAsync(instr.hp);
      }
    }
  };

  const mapRoleToDisplay = (role: "user" | "assistant" | "system"): DisplayRole => {
    if (role === "assistant") return "assistant";
    if (role === "user") return "user";
    return "system";
  };

  const processHistoryMessages = (history: HistoryMessage[]): ProcessedMessage[] =>
    history.map((msg, i) => {
      const instrs: GameInstructionDto[] = Array.isArray(msg.instructions)
        ? msg.instructions
        : msg.instructions
          ? [msg.instructions]
          : [];

      // Filter to only processable instructions (skip spell instructions etc.)
      instrs
        .filter(isProcessableInstruction)
        .forEach(instr => processInstructionInMessage(instr, i === history.length - 1));

      return {
        role: mapRoleToDisplay(msg.role),
        narrative: msg.narrative,
      };
    });

  const getCharIdFromRoute = (): string | undefined => {
    const route = useRoute();
    const charId = String(route.params.characterId || "");
    return charId || undefined;
  };

  const ensureCharacterLoaded = async () => {
    if (currentCharacter) return currentCharacter;
    const charId = getCharIdFromRoute();
    if (!charId) {
      await router.push("/home");
      return undefined;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    if (!currentCharacter) {
      await router.push("/home");
      return undefined;
    }
    return currentCharacter;
  };

  const startGame = async () => {
    const character = await ensureCharacterLoaded();
    if (!character) return;
    isInitializing.value = true;
    try {
      // Get history using Vue Query hook
      const messages = chat.history.data.value;
      if (messages?.length) {
        const processed = processHistoryMessages(messages as HistoryMessage[]);
        gameStore.updateMessages(processed);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage("system", `Error: ${msg}`);
    }
    isInitializing.value = false;
  };

  return { startGame };
};
