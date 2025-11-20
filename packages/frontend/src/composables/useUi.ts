import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useEventBus } from '@rpg/shared';

export const useUi = defineStore('ui', () => {
  const notifications = ref<string[]>([]);

  const pushNotification = (message: string) => {
    notifications.value.push(message);
  };

  const notify = (message: string) => {
    pushNotification(message);
    const bus = useEventBus();
    bus.emit('notify', { message });
  };

  return { notifications, notify, pushNotification };
});
