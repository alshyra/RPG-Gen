import { useCombatStore } from "@/stores/combatStore";
import { useCharacter, useCombat as useCombatApi } from "@rpg-gen/api-client";
import type {
  CombatActionResponseDto,
  CombatantDto,
  CombatStartInstructionMessageDto,
  CombatStartRequestDto,
  CombatStateDto,
  EndPlayerTurnResponseDto,
} from "@rpg-gen/shared";
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/gameStore";
import { useCharacterId } from "./useCharacterId";
import { useCombatInfo } from "./useCombatStatus";
import { useCurrentCharacter } from "./useCurrentCharacter";
import { storeToRefs } from "pinia";

/**
 * Composable for combat-specific actions and state management
 */

export function useCombat() {
  const router = useRouter();
  const gameStore = useGameStore();
  const currentCharacter = useCurrentCharacter();
  const characterId = useCharacterId();
  const combatApi = useCombatApi(characterId);
  const combatInfo = useCombatInfo();
  const character = useCharacter(characterId);
  const combatStore = useCombatStore();
  const { currentPlayerAttackLog } = storeToRefs(combatStore);

  /**
   * Start a combat session
   * Replaces combatStore.startCombat()
   */
  const startCombat = async (
    charId: string,
    instruction: CombatStartRequestDto,
  ): Promise<CombatStateDto> => {
    const response = await combatApi.startCombat.mutateAsync({
      characterId: charId,
      data: instruction,
    });
    return response;
  };

  /**
   * Fetch current combat status
   * Replaces combatStore.fetchStatus()
   */
  const fetchCombatStatus = async (): Promise<void> => {
    await combatApi.status.refetch();
  };

  /**
   * End player turn and get enemy attack logs
   * Replaces combatStore.endActivation()
   */
  const endActivation = async (charId: string): Promise<EndPlayerTurnResponseDto> => {
    const response = await combatApi.endTurn.mutateAsync(charId);
    if (response.attackLogs?.length) {
      await combatStore.processAttackLogs(response.attackLogs);
    }
    return response;
  };

  /**
   * Perform an attack against a target
   * Replaces combatStore.performAttack() - now uses executeAttack internally
   */
  const performAttack = async (
    target: CombatantDto,
    spellName?: string,
  ): Promise<CombatActionResponseDto> => {
    return combatApi.attack.mutateAsync({
      characterId: characterId.value!,
      target,
      spellName,
    });
  };

  /**
   * End the current combat session
   * Replaces combatStore.endCombatSession()
   */
  const endCombatSession = async (charId: string): Promise<void> => {
    await combatApi.endCombat.mutateAsync(charId);
    combatStore.clearCombat();
  };

  const displayCombatStartSuccess = (combatState: {
    narrative?: string;
    turnOrder: {
      name: string;
      initiative: number;
    }[];
  }): void => {
    if (combatState.narrative) gameStore.appendMessage("system", combatState.narrative);
    const initiativeOrder = combatState.turnOrder
      .map(c => `${c.name} (${c.initiative})`)
      .join(" → ");
    gameStore.appendMessage("system", `📋 Ordre d'initiative: ${initiativeOrder}`);
    gameStore.appendMessage("system", "Utilisez /attack [nom_ennemi] pour attaquer.");
  };

  /**
   * Initialize combat from a combat_start instruction
   */
  const initializeCombat = async (instruction: CombatStartInstructionMessageDto): Promise<void> => {
    console.log("[useCombat] initializeCombat instruction", instruction);
    if (!currentCharacter.value) return;

    const enemyNames = instruction.combat_start.map(e => e.name).join(", ");
    gameStore.appendMessage("system", `⚔️ Combat engagé! Ennemis: ${enemyNames}`);

    try {
      const payload = { combat_start: instruction.combat_start };
      const currentHp = currentCharacter.value.hp ?? 0;
      const combatState = await startCombat(currentCharacter.value.characterId, payload);

      // Check if player took damage during initiative (enemy attacked first)
      const newHp = combatState.player?.hp ?? currentHp;
      const initialDamage = currentHp - newHp;
      if (initialDamage > 0) {
        gameStore.appendMessage(
          "system",
          `⚡ Les ennemis attaquent en premier! Vous subissez ${initialDamage} dégâts!`,
        );
        // Sync HP to character store (will update via TanStack Query cache)
        await character.updateHp.mutateAsync(newHp);
      }

      currentCharacter.value.isDeceased = newHp <= 0;

      displayCombatStartSuccess(combatState);
      // Navigate to combat arena when combat starts
      await router.push({
        name: "game-combat",
        params: { characterId: currentCharacter.value.characterId },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to start combat";
      gameStore.appendMessage("system", `❌ Erreur de combat: ${errorMsg}`);
    }
  };

  const displayAttackResultMessage = (
    target: CombatantDto,
    result: CombatActionResponseDto,
  ): void => {
    const targetName = target?.name || "cible inconnue";
    const { damageTotal, isCrit } = result;
    if (damageTotal && damageTotal > 0) {
      const critMsg = isCrit ? " (CRITIQUE!)" : "";
      gameStore.appendMessage(
        "system",
        `✅ Attaque réussie contre ${targetName}! Dégâts: ${damageTotal}${critMsg}`,
      );
    } else {
      gameStore.appendMessage("system", `❌ Attaque manquée contre ${targetName}.`);
    }
  };

  const handleAttackError = (err: unknown): void => {
    const message = err instanceof Error ? err.message : "Failed to attack";
    const sessionLost =
      message.includes("Combat session not found") ||
      message.includes("Character is not in combat");
    if (sessionLost) {
      combatStore.clearCombat();
      gameStore.appendMessage(
        "system",
        "⚠️ Combat terminé (session introuvable) — l'état a été réinitialisé.",
      );
    } else {
      gameStore.appendMessage("system", `❌ Erreur: ${message}`);
    }
  };

  const checkCombatVictory = (result: CombatActionResponseDto): void => {
    // First check if backend returned explicit combatEnd
    if (!result.combatEnd) return;
    void handleCombatEnd(
      result.combatEnd.victory,
      result.combatEnd.xp_gained,
      result.combatEnd.enemies_defeated,
      result.narrative!,
    );
  };

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const showPlayerAttackAnimation = async (result: CombatActionResponseDto): Promise<void> => {
    currentPlayerAttackLog.value = result;
    await delay(combatStore.PLAYER_ATTACK_DELAY_MS);
    currentPlayerAttackLog.value = null;
  };

  /* Helpers to keep executeAttack small (reduce statement count) */
  const beginAttack = (target: CombatantDto) => {
    const targetName = target?.name || "cible inconnue";
    gameStore.appendMessage("user", `J'attaque ${targetName}!`);
    gameStore.sending = true;
  };

  const processAttackResult = async (result: CombatActionResponseDto, target: CombatantDto) => {
    if (!target?.id) {
      console.error("[useCombat] processAttackResult: invalid target", target);
      return;
    }

    // snapshot previous state (before applying server-returned state)
    const prevEnemies = combatInfo.enemies.value.map(e => ({ ...e }));
    const prevPlayer = combatInfo.player.value ? { ...combatInfo.player.value } : null;

    // build client-friendly AttackView so components can display consistent values
    const targetBefore = prevEnemies.find(e => e.id === target.id);
    const targetAfter = result.combatState?.enemies?.find((e: CombatantDto) => e.id === target.id);

    const attackView = {
      attacker: prevPlayer?.name ?? "Vous",
      attackerId: prevPlayer?.id,
      target: target.name ?? "cible inconnue",
      targetId: target.id,
      hit: result.damageTotal !== undefined || !!result.damageDiceResult,
      damageRoll: result.damageDiceResult?.rolls ?? [],
      damageBonus: 0,
      totalDamage: result.damageTotal ?? 0,
      critical: result.isCrit ?? false,
      targetHpBefore: targetBefore?.hp ?? 0,
      targetHpAfter: targetAfter?.hp ?? 0,
      targetDefeated: (targetAfter?.hp ?? 0) <= 0,
    };

    currentAttackView.value = attackView;

    await showPlayerAttackAnimation(result);
    displayAttackResultMessage(target, result);
    checkCombatVictory(result);
  };

  /**
   * Execute an attack against a target
   */
  const executeAttack = async (target: CombatantDto, spellName?: string): Promise<void> => {
    if (!currentCharacter.value) return;

    // Guard: prevent executing an attack when player cannot act or it's not the player's turn.
    if (!combatInfo.canAct.value) {
      gameStore.appendMessage("system", `⚠️ Vous n'avez plus de points d'action disponibles.`);
      return;
    }

    // Prevent duplicate calls while a send is in progress
    if (gameStore.sending) return;

    beginAttack(target);

    try {
      const result = await combatApi.attack.mutateAsync({
        spellName,
        target,
        characterId: currentCharacter.value.characterId,
      });
      await processAttackResult(result, target);
    } catch (err) {
      handleAttackError(err);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Handle combat end instruction
   */
  const handleCombatEnd = async (
    victory: boolean,
    xpGained: number,
    enemiesDefeated: string[],
    _narrative: string,
  ): Promise<void> => {
    if (!victory) {
      gameStore.appendMessage("system", "💀 Combat terminé.");
      combatStore.clearCombat();
      // Navigate back to messages view
      await router.push({
        name: "game",
        params: { characterId: currentCharacter.value?.characterId },
      });
      return;
    }

    // Victory path: show modal with narrative first
    gameStore.appendMessage("system", "🏆 Victoire!");
    if (enemiesDefeated.length > 0) {
      gameStore.appendMessage("system", `⚔️ Ennemis vaincus: ${enemiesDefeated.join(", ")}`);
    }
    if (xpGained > 0) {
      gameStore.appendMessage("system", `✨ XP gagnés: ${xpGained}`);
      await character.updateXp.mutateAsync(xpGained);
    }

    isCombatEndModalOpen.value = true;
  };

  /**
   * Close combat end modal and navigate home
   */
  const closeCombatEndModal = async () => {
    isCombatEndModalOpen.value = false;
    combatStore.clearCombat();
    await router.push({
      name: "game",
      params: { characterId: currentCharacter.value?.characterId },
    });
  };

  /**
   * Flee from combat
   */
  const fleeCombat = async (): Promise<void> => {
    const c = currentCharacter.value;
    if (!c) return;

    try {
      await combatApi.endCombat.mutateAsync(characterId.value!);
      gameStore.appendMessage("system", "🏃 Vous avez fui le combat.");
      combatStore.clearCombat();
      // Navigate back to messages view
      await router.push({
        name: "game",
        params: { characterId: c.characterId },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to flee";
      gameStore.appendMessage("system", `❌ Erreur: ${errorMsg}`);
    }
  };

  /**
   * Check if currently in combat
   */
  const checkCombatStatus = async (): Promise<boolean> => {
    if (!currentCharacter.value) return false;
    await fetchCombatStatus();
    const inCombat = combatInfo.inCombat.value;
    // If player is in combat after refresh, navigate to combat arena
    if (inCombat) {
      await router.push({
        name: "game-combat",
        params: { characterId: currentCharacter.value.characterId },
      });
    }
    return inCombat;
  };

  return {
    // Workflow functions (moved from combatStore)
    startCombat,
    fetchCombatStatus,
    endActivation,
    performAttack,
    endCombatSession,

    // Actions
    initializeCombat,
    executeAttack,
    handleCombatEnd,
    fleeCombat,
    checkCombatStatus,
    checkCombatVictory,

    // Modal state
    isCombatEndModalOpen,
    closeCombatEndModal,
  };
}
