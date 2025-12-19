npm <template>
  <div>
    <div class="grid grid-cols-4 gap-2">
      <div
        v-for="allowedRace in availableRaces"
        :key="allowedRace.id"
        variant="primary"
        :class="['cursor-pointer p-2 rounded border', additionalSelectedClass(allowedRace)]"
        @click.prevent="onRaceUpdate(allowedRace)"
      >
        <div class="font-medium">
          {{ allowedRace.name }}
        </div>
        <div class="text-xs text-slate-400">
          {{ summaryMods(allowedRace.mods) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCharacterId } from '@/composables/useCharacterId';
import { useCurrentCharacter } from '@/composables/useCurrentCharacter';
import { RaceMetadata, useAvailableRaces, useCharacter } from '@rpg-gen/api-client';
import { RaceResponseDto } from '@rpg-gen/shared';

const currentCharacter = useCurrentCharacter();
const currentCharacterId = useCharacterId();
const { update } = useCharacter(currentCharacterId);
const { data: availableRaces } = useAvailableRaces();

const additionalSelectedClass = (allowedRace: RaceMetadata) =>
  currentCharacter?.value?.race?.id === allowedRace.id
    ? 'border-indigo-500 bg-indigo-600/20'
    : 'border-slate-700';

const summaryMods = (mods: RaceResponseDto['mods']) => {
  try {
    return Object.entries(mods)
      .map(
        ([attributeName, statAdjustment]) =>
          `${attributeName}${statAdjustment >= 0 ? '+' + statAdjustment : statAdjustment}`,
      )
      .join(' ');
  } catch {
    return '';
  }
};

const onRaceUpdate = async (race: RaceResponseDto) => await update.mutateAsync({ race });
</script>
