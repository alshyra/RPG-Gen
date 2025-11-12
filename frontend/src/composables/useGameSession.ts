import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/gameStore';
import { gameEngine } from '../services/gameEngine';

export function useGameSession() {
  const route = useRoute();
  const gameStore = useGameStore();

  /**
   * Initialize game session with character and world
   */
  async function initSession() {
    if (gameStore.isDead) gameStore.setDeathModalVisible(true);

    const map: Record<string, string> = {
      dnd: 'Dungeons & Dragons',
      vtm: 'Vampire: The Masquerade',
      cyberpunk: 'Cyberpunk'
    };
    const worldParam = (route.params.world as string) || '';
    gameStore.setWorld(worldParam, map[worldParam] || worldParam);
    gameStore.setInitializing(true);

    try {
      // Initialize game session (linked to current character)
      const { messages: history } = await gameEngine.initSession();

      // Load history with instructions parsing
      if (history && Array.isArray(history)) {
        const processedMessages = history.map((msg, i) => {
          const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;

          // Process instructions
          if ((msg as any).instructions?.length) {
            (msg as any).instructions.forEach((instr: any) => {
              if (instr.roll) {
                if (i === history.length - 1) {
                  gameStore.setPendingInstruction(instr);
                }
                gameStore.appendMessage(
                  'System',
                  `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`
                );
              } else if (instr.xp) {
                gameStore.appendMessage('System', `✨ Gained ${instr.xp} XP`);
              } else if (instr.hp) {
                const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
                gameStore.appendMessage('System', `❤️ HP changed: ${hpChange}`);
              }
            });
          }

          return { role, text: msg.text };
        });

        gameStore.updateMessages(processedMessages);
      }
    } catch (e: any) {
      gameStore.appendMessage('Error', e?.response?.data?.error || e.message);
    }
    gameStore.setInitializing(false);
  }

  return {
    initSession
  };
}
