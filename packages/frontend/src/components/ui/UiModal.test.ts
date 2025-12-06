import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import UiModal from './UiModal.vue';

describe('UiModal', () => {
  it('renders title in header when provided and emits confirm/cancel', async () => {
    const wrapper = mount(UiModal, {
      props: {
        isOpen: true,
        title: 'Hello Title',
      },
    });

    expect(wrapper.text())
      .toContain('Hello Title');

    const confirm = wrapper.get('[data-cy="modal-confirm"]');
    await confirm.trigger('click');
    expect(wrapper.emitted())
      .toHaveProperty('confirm');
    expect(wrapper.emitted())
      .toHaveProperty('close');

    const cancel = wrapper.get('[data-cy="modal-cancel"]');
    await cancel.trigger('click');
    expect(wrapper.emitted())
      .toHaveProperty('cancel');
  });

  it('header slot overrides title', () => {
    const wrapper = mount(UiModal, {
      props: {
        isOpen: true,
        title: 'ignored',
      },
      slots: { header: '<div data-test="hdr">Slot header</div>' },
    });

    expect(wrapper.find('[data-test="hdr"]')
      .exists())
      .toBe(true);
    expect(wrapper.text()).not.toContain('ignored');
  });

  it('footer slot overrides default actions', () => {
    const wrapper = mount(UiModal, {
      props: { isOpen: true },
      slots: { footer: '<div data-test="custom-foot">My footer</div>' },
    });

    expect(wrapper.find('[data-test="custom-foot"]')
      .exists())
      .toBe(true);
    // default confirm/cancel should not be present when footer slot is used
    expect(wrapper.find('[data-cy="modal-confirm"]')
      .exists())
      .toBe(false);
    expect(wrapper.find('[data-cy="modal-cancel"]')
      .exists())
      .toBe(false);
  });
});
