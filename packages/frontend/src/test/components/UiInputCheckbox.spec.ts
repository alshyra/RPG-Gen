import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, ref } from 'vue';
import UiInputCheckbox from '../../components/ui/UiInputCheckbox.vue';

describe('UiInputCheckbox Component', () => {
  it('should render a checkbox element', () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { name: 'test-checkbox' },
    });
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  it('should be checked when modelValue prop is true', () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { modelValue: true, name: 'test-checkbox' },
    });

    // aria-checked should reflect the checked state
    expect(wrapper.find('[data-testid="ui-checkbox"]').attributes('aria-checked')).toBe('true');
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true);
  });

  it('should not be checked when checked prop is false', () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { checked: false, name: 'test-checkbox' },
    });
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false);
  });

  it('should emit change event when checkbox is toggled', async () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { checked: false, name: 'test-checkbox' },
    });

    await wrapper.find('[data-testid="ui-checkbox"]').trigger('click');
    expect(wrapper.emitted()).toHaveProperty('update:modelValue');
  });

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { disabled: true, name: 'test-checkbox' },
    });
    expect(wrapper.find('input[type="checkbox"]').element.disabled).toBe(true);
  });

  it('should not be disabled when disabled prop is false', () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { disabled: false, name: 'test-checkbox' },
    });
    expect(wrapper.find('input[type="checkbox"]').element.disabled).toBe(false);
  });

  it('should render different sizes from props', () => {
    const wrapperSm = mount(UiInputCheckbox, { props: { size: 'sm', name: 'test-sm' } });
    expect(wrapperSm.find('[data-testid="ui-checkbox"] > span').classes()).toContain('w-4');

    const wrapperMd = mount(UiInputCheckbox, { props: { size: 'md', name: 'test-md' } });
    expect(wrapperMd.find('[data-testid="ui-checkbox"] > span').classes()).toContain('w-5');

    const wrapperLg = mount(UiInputCheckbox, { props: { size: 'lg', name: 'test-lg' } });
    expect(wrapperLg.find('[data-testid="ui-checkbox"] > span').classes()).toContain('w-6');
  });

  it('should toggle when clicking on the label text (slot)', async () => {
    const wrapper = mount(UiInputCheckbox, {
      props: { name: 'test-checkbox' },
      slots: { default: 'Clickable label' },
    });

    // checkbox starts unchecked
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false);
    await wrapper.find('label').trigger('click');

    // After click, should emit update
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
  });

  it('works with v-model and updates parent state', async () => {
    const TestComponent = {
      components: { UiInputCheckbox },
      setup() {
        const checkedState = ref(false);
        return () =>
          h('div', [
            h(UiInputCheckbox, {
              name: 'test-checkbox',
              modelValue: checkedState.value,
              'onUpdate:modelValue': (v: boolean) => {
                checkedState.value = v;
              },
            }),
            h('span', { 'data-testid': 'val' }, checkedState.value.toString()),
          ]);
      },
    };

    const wrapper = mount(TestComponent);

    expect(wrapper.find('[data-testid="ui-checkbox"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="val"]').text()).toBe('false');

    await wrapper.find('[data-testid="ui-checkbox"]').trigger('click');
    expect(wrapper.find('[data-testid="val"]').text()).toBe('true');
  });
});
