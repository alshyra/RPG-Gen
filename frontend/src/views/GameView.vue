<template>
  <div class="flex flex-col h-[94vh] p-4 gap-2">
    <!-- Main content area (fills remaining space) -->
    <div class="grid lg:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden" style="grid-template-rows: 1fr auto;">
      <!-- Left: character info panel -->
      <aside class="lg:col-span-3 lg:row-span-2 flex flex-col gap-2 min-h-0 overflow-hidden">
        <CharacterPortrait :character="sessionChar" class="flex-shrink-0" />
        <div class="card flex-1 overflow-auto min-h-0">
          <AbilityScores :character="sessionChar" class="mt-3" />
          <div class="border-t border-slate-600 mt-3"></div>
          <SkillsPanel v-if="sessionChar" :character="sessionChar" class="mt-3" />
        </div>
      </aside>

      <!-- Center: messages (scrollable) -->
      <main class="lg:col-span-9 flex flex-col min-h-0 overflow-hidden">
        <div class="flex-1 overflow-auto" ref="messagesPane">
          <div class="space-y-3 p-2">
            <div v-for="(m, idx) in messages" :key="idx"
              class="p-3 rounded-md bg-slate-800/60 border border-slate-700/40">
              <div class="text-xs text-slate-400 font-medium">{{ m.role }}</div>
              <MarkdownVue :text="m.text"></MarkdownVue>
            </div>
          </div>
        </div>
      </main>

      <!-- Chat Bar (aligned with messages in grid) -->
      <div class="lg:col-start-4 lg:col-span-9">
        <ChatBar :player-text="playerText" :pending-instruction="pendingInstruction" :is-thinking="initializing"
          @update:player-text="playerText = $event" @send="send" @rolled="onDiceRolled" />
      </div>
    </div>
    <RollResultModal :is-open="showRollModal" :dice-notation="rollData.diceNotation" :dice-value="rollData.diceValue"
      :rolls="rollData.rolls" :modifier="rollData.modifier" :total="rollData.total" @confirm="confirmRoll"
      @reroll="rerollDice" @close="showRollModal = false" />

    <DeathModal :is-open="showDeathModal" :character="sessionChar" @confirm="onDeathConfirm"
      @close="showDeathModal = false" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RollResultModal from '../components/RollResultModal.vue';
import DeathModal from '../components/DeathModal.vue';
import ChatBar from '../components/ChatBar.vue';
import CharacterPortrait from '../components/CharacterPortrait.vue';
import AbilityScores from '../components/AbilityScores.vue';
import SkillsPanel from '../components/SkillsPanel.vue';
import MarkdownVue from '../ui/markdown.vue';
import { gameEngine, type GameInstruction } from '../services/gameEngine';
import { CharacterEntry, characterService } from '../services/characterService';
import { type RollModalData } from '../services/rollTypes';

const route = useRoute();
const router = useRouter();
const world = ref((route.params.world as string) || '');
const worldName = ref('—');
const initializing = ref(false);
const playerText = ref('');
const messages = ref<Array<{ role: string, text: string }>>([]);
const messagesPane = ref<HTMLElement | null>(null);
const pendingInstruction = ref<GameInstruction | null>(null);
const showRollModal = ref(false);
const rollData = ref<RollModalData>({ rolls: [], total: 0, modifier: 0, diceNotation: '', diceValue: 0 });
const showDeathModal = ref(false);

const sessionChar = computed<CharacterEntry | null>(() => characterService.getCurrentCharacter());
const charHpMax = computed(() => sessionChar.value?.hpMax || 12);
const checkDead = computed(() => (sessionChar.value?.hp || 0) === 0);

function append(role: string, text: string) { messages.value.push({ role, text }); }

const updateHp = (delta: number) => {
  if (!sessionChar.value) return;

  const charCopy = { ...sessionChar.value };
  charCopy.hp = Math.max(0, Math.min(charHpMax.value, charCopy.hp + delta));
  characterService.updateCurrentCharacter(charCopy);

  // Check if dead
  if (checkDead.value) {
    showDeathModal.value = true;
  }
}

const updateXp = (delta: number) => {
  if (!sessionChar.value) return;

  const charCopy = { ...sessionChar.value };
  charCopy.totalXp = (charCopy.totalXp || 0) + delta;

  characterService.updateCurrentCharacter(charCopy);
}

async function init() {
  if (checkDead.value) showDeathModal.value = true;

  const map: any = { dnd: 'Dungeons & Dragons', vtm: 'Vampire: The Masquerade', cyberpunk: 'Cyberpunk' };
  worldName.value = map[world.value as string] || (world.value as string);
  initializing.value = true;

  try {
    // Initialize game session (linked to current character)
    const { messages: history } = await gameEngine.initSession();

    // Load history with instructions parsing
    if (history && Array.isArray(history)) {
      history.forEach((msg, i) => {
        const role = msg.role === 'assistant' ? 'GM' : msg.role === 'user' ? 'Player' : msg.role;
        append(role, msg.text);

        if ((msg as any).instructions?.length) {
          (msg as any).instructions.forEach((instr: any) => {
            if (instr.roll) {
              if (i === history.length - 1) {
                pendingInstruction.value = instr;
              }
              append('System', `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`);
            } else if (instr.xp) {
              append('System', `✨ Gained ${instr.xp} XP`);
            } else if (instr.hp) {
              const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
              append('System', `❤️ HP changed: ${hpChange}`);
            }
          });
        }
      });
    }
  } catch (e: any) {
    append('Error', e?.response?.data?.error || e.message);
  }
  initializing.value = false;
}

// Load character first, then initialize game session
onMounted(async () => {
  try {
    // Now initialize game session with character loaded
    await init();
  } catch (e) {
    append('Error', String(e));
  }
});

// auto-scroll to bottom when messages change
watch(messages, () => {
  if (messagesPane.value) {
    setTimeout(() => { messagesPane.value!.scrollTop = messagesPane.value!.scrollHeight; }, 50);
  }
}, { deep: true });

async function send() {
  if (!playerText.value) return;
  append('Player', playerText.value);
  append('System', '...thinking...');

  try {
    const msgText = playerText.value;
    playerText.value = '';
    const response = await gameEngine.sendMessage(msgText);
    messages.value.pop(); // remove thinking

    append('GM', response.text);

    // Handle game instructions (roll, xp, hp)
    for (const instr of response.instructions) {
      if (instr.roll) {
        pendingInstruction.value = instr;
        append('System', `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`);
      } else if (instr.xp) {
        append('System', `✨ Gained ${instr.xp} XP`);
        updateXp(instr.xp);
      } else if (instr.hp) {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        append('System', `❤️ HP changed: ${hpChange}`);
        updateHp(instr.hp);
      }
    }
  } catch (e: any) {
    messages.value.pop();
    append('Error', e?.message || 'Failed to send message');
  }
}

// Handle dice roll completion - show modal instead of inline
async function onDiceRolled(rollResult: any) {
  if (!pendingInstruction.value?.roll) return;

  const instr = pendingInstruction.value.roll;

  // rollResult contains: diceValue (1-20), bonus (ability modifier), total (sum)
  const diceValue = rollResult.diceValue || 0;
  const bonus = rollResult.bonus || 0;
  const total = rollResult.total || (diceValue + bonus);

  // Store roll data for modal
  rollData.value = {
    diceValue,
    rolls: [diceValue],  // For display, just the d20 result
    total,
    modifier: bonus,
    diceNotation: instr.dices
  };

  showRollModal.value = true;
}

// Confirm roll and send result to backend
async function confirmRoll() {
  if (!pendingInstruction.value?.roll) return;

  const instr = pendingInstruction.value.roll;
  const diceValue = rollData.value.rolls[0];  // The raw d20 result
  const bonus = rollData.value.modifier;
  const totalWithModifier = diceValue + bonus;

  // Detect critical success/failure for Gemini
  let criticalNote = '';
  if (diceValue === 20) criticalNote = ' (CRITICAL SUCCESS - Natural 20!)';
  else if (diceValue === 1) criticalNote = ' (CRITICAL FAILURE - Natural 1!)';

  // Display result
  append('System', `Rolled: [${diceValue}] = ${diceValue}${bonus > 0 ? ` + ${bonus}` : ''} (${instr.modifier || 'none'}) = **${totalWithModifier}**${criticalNote}`);

  // Send roll result back to backend/Gemini with critical detection
  try {
    const rollResultMsg = `Roll result: d20 = ${diceValue}${bonus > 0 ? ` + ${bonus}` : ''} = ${totalWithModifier}${criticalNote}`;
    const response = await gameEngine.sendMessage(rollResultMsg);
    append('GM', response.text);
    pendingInstruction.value = null;
    showRollModal.value = false;

    // Handle additional instructions
    for (const instr of response.instructions) {
      if (instr.roll) {
        pendingInstruction.value = instr;
        append('System', `🎲 Roll needed: ${instr.roll.dices}${instr.roll.modifier ? ` + ${instr.roll.modifier}` : ''}`);
      } else if (instr.xp) {
        append('System', `✨ Gained ${instr.xp} XP`);
        updateXp(instr.xp);
      } else if (instr.hp) {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        append('System', `❤️ HP changed: ${hpChange}`);
        updateHp(instr.hp);
      }
    }
  } catch (e: any) {
    append('Error', 'Failed to send roll result: ' + e.message);
    showRollModal.value = false;
  }
}

// Reroll dice (keep modal open)
async function rerollDice() {
  if (!pendingInstruction.value?.roll) return;

  const instr = pendingInstruction.value.roll;
  const rollResult = gameEngine.rollDice(instr.dices);
  const diceValue = rollResult.total;  // For 1d20, total IS the dice value
  const modifier = gameEngine.getAbilityModifier(sessionChar.value, instr.modifier || 'strength');

  // Update roll data with new rolls
  rollData.value = {
    diceValue,
    rolls: rollResult.rolls,
    total: diceValue + modifier,
    modifier,
    diceNotation: instr.dices
  };
}

// Handle character death
const onDeathConfirm = () => {
  console.log('Character has died', sessionChar.value);
  if (!sessionChar.value?.id) return;

  // Save to deceased characters list
  characterService.killCharacter(sessionChar.value.id, worldName.value);

  // Clear session
  gameEngine.clearSession();
  showDeathModal.value = false;

  // Redirect to home
  router.push('/');
}

</script>

<style scoped></style>
