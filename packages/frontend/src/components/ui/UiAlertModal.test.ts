import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import UiAlertModal from './UiAlertModal.vue';
import { showAlert, showConfirm, useModalState } from '@/composables/useModal';

describe('UiAlertModal', () => {
  it('resolves showAlert when OK clicked', async () => {
    const wrapper = mount(UiAlertModal);

    const p = showAlert('Hello world');

    // modal should be visible
    expect(useModalState().isOpen)
      .toBe(true);

    // click OK
    await wrapper.get('[data-cy="modal-ok"]')
      .trigger('click');

    await expect(p).resolves.toBeUndefined();
    expect(useModalState().isOpen)
      .toBe(false);
  });

  it('resolves showConfirm with true/false based on buttons', async () => {
    const wrapper = mount(UiAlertModal);

    // Cancel path
    const p1 = showConfirm('Are you sure?');
    expect(useModalState().isOpen)
      .toBe(true);
    await wrapper.get('[data-cy="modal-cancel"]')
      .trigger('click');
    await expect(p1).resolves.toBe(false);
    expect(useModalState().isOpen)
      .toBe(false);

    // OK path
    const p2 = showConfirm('Go?');
    expect(useModalState().isOpen)
      .toBe(true);
    await wrapper.get('[data-cy="modal-ok"]')
      .trigger('click');
    await expect(p2).resolves.toBe(true);
    expect(useModalState().isOpen)
      .toBe(false);
  });
});
