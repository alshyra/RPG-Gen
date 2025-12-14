import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UiInputText } from '@rpg-gen/ui';

describe('UiInputText Component', () => {
  it('should render an input element', () => {
    const wrapper = mount(UiInputText);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
  });

  it('should display the modelValue', () => {
    const wrapper = mount(UiInputText, {
      props: { modelValue: 'Test Value' },
    });
    const input = wrapper.find('input[type="text"]').element as HTMLInputElement;
    expect(input.value).toBe('Test Value');
  });

  it('should emit update:modelValue when text is entered', async () => {
    const wrapper = mount(UiInputText, {
      props: {
        modelValue: '',
        'onUpdate:modelValue': vi.fn(),
      },
    });

    const input = wrapper.find('input[type="text"]');
    await input.setValue('Hello World');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hello World']);
  });

  it('should accept placeholder prop', () => {
    const wrapper = mount(UiInputText, {
      props: { placeholder: 'Enter your name' },
    });
    expect(wrapper.find('input[type="text"]').attributes('placeholder')).toBe('Enter your name');
  });

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(UiInputText, {
      props: { disabled: true },
    });
    const input = wrapper.find('input[type="text"]').element as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('should not be disabled when disabled prop is false', () => {
    const wrapper = mount(UiInputText, {
      props: { disabled: false },
    });
    const input = wrapper.find('input[type="text"]').element as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });
});
