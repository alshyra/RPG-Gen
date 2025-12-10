import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import UiInputTextarea from '../../components/ui/UiInputTextarea.vue';

describe('UiInputTextarea Component', () => {
  it('should render a textarea element', () => {
    const wrapper = mount(UiInputTextarea);
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('should display the modelValue', () => {
    const wrapper = mount(UiInputTextarea, {
      props: { modelValue: 'Test Content' },
    });
    expect(wrapper.find('textarea').element.value).toBe('Test Content');
  });

  it('should emit update:modelValue when text is entered', async () => {
    const wrapper = mount(UiInputTextarea, {
      props: {
        modelValue: '',
        'onUpdate:modelValue': vi.fn(),
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Hello World');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hello World']);
  });

  it('should accept placeholder prop', () => {
    const wrapper = mount(UiInputTextarea, {
      props: { placeholder: 'Enter your description' },
    });
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Enter your description');
  });

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(UiInputTextarea, {
      props: { disabled: true },
    });
    expect(wrapper.find('textarea').element.disabled).toBe(true);
  });

  it('should not be disabled when disabled prop is false', () => {
    const wrapper = mount(UiInputTextarea, {
      props: { disabled: false },
    });
    expect(wrapper.find('textarea').element.disabled).toBe(false);
  });

  it('should respect rows prop', () => {
    const wrapper = mount(UiInputTextarea, {
      props: { rows: 5 },
    });
    expect(wrapper.find('textarea').attributes('rows')).toBe('5');
  });
});
