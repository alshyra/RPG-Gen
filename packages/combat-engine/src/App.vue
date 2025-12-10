<template>
  <div>
    <CombatArena
      ref="combatarena"
      :manual-init="true"
    />

    <div style="padding: 20px; color: white; text-align: center">
      <p>Drag the green archer to move it (max 3 tiles)</p>
      <p>Click on the red enemy to see actions</p>
      <div
        id="event-log"
        style="margin-top: 10px; font-size: 12px; color: #aaa"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import CombatArena from './CombatArena.vue';

const combatarena = ref<InstanceType<typeof CombatArena>>();

function logEvent(message: string) {
  const log = document.getElementById('event-log');
  if (log) {
    const timestamp = new Date().toLocaleTimeString();
    log.innerHTML = `[${timestamp}] ${message}<br>` + log.innerHTML;
    // Keep only last 5 messages
    const lines = log.innerHTML.split('<br>');
    if (lines.length > 5) {
      log.innerHTML = lines.slice(0, 5).join('<br>');
    }
  }
}

onMounted(async () => {
  if (!combatarena.value) return;

  // Get the internal container from CombatArena
  const container = combatarena.value.getContainer();
  if (!container) return;

  await combatarena.value.init(container);

  // Create player unit (draggable)
  await combatarena.value.createUnit('player', 1, 5, 3, 'Archer-Green', 100, 100, true);
  logEvent('✅ Player created at (1,5)');

  // Create enemy unit (not draggable)
  await combatarena.value.createUnit('enemy-1', 5, 1, 3, 'Soldier-Red', 50, 50, false);
  logEvent('✅ Enemy created at (5,1)');

  combatarena.value.setupDragEvents();
  logEvent('✅ Drag events enabled');

  // Listen to combat events
  combatarena.value.on('unit:clicked', (payload: unknown) => {
    const p = payload as { unitId: string; isPlayer: boolean };
    logEvent(`🖱️ Unit clicked: ${p.unitId} (player: ${p.isPlayer})`);
  });

  combatarena.value.on('unit:moved', (payload: unknown) => {
    const p = payload as { unitId: string; gridX: number; gridY: number };
    logEvent(`🚶 Unit moved: ${p.unitId} to (${p.gridX}, ${p.gridY})`);
  });

  combatarena.value.on('unit:attacked', (payload: unknown) => {
    const p = payload as { attackerId: string; targetId: string };
    logEvent(`⚔️ Attack: ${p.attackerId} → ${p.targetId}`);
  });
});
</script>
