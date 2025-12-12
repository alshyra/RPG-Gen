import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UiSelect } from '../src/';

describe('UiSelect Component', () => {
  it('should render a select element', () => {
    const wrapper = mount(UiSelect, {
      props: { modelValue: 'option1' },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        `,
      },
    });

    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('should display the selected value', () => {
    const wrapper = mount(UiSelect, {
      props: { modelValue: 'option2' },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        `,
      },
    });

    expect(wrapper.find('select').element.value).toBe('option2');
  });

  it('should emit update:modelValue when selection changes', async () => {
    const onUpdate = vi.fn();
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'option1',
        'onUpdate:modelValue': onUpdate,
      },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        `,
      },
    });

    const select = wrapper.find('select');
    await select.setValue('option2');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option2']);
  });

  it('should render multiple options', () => {
    const wrapper = mount(UiSelect, {
      props: { modelValue: 'option1' },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
          <option value="option4">Option 4</option>
        `,
      },
    });

    const options = wrapper.findAll('option');
    expect(options).toHaveLength(4);
  });

  it('should be disabled when disabled prop is true', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'option1',
        disabled: true,
      },
      slots: {
        default: '<option value="option1">Option 1</option>',
      },
    });

    expect(wrapper.find('select').element.disabled).toBe(true);
  });

  it('should not be disabled when disabled prop is false', () => {
    const wrapper = mount(UiSelect, {
      props: {
        modelValue: 'option1',
        disabled: false,
      },
      slots: {
        default: '<option value="option1">Option 1</option>',
      },
    });

    expect(wrapper.find('select').element.disabled).toBe(false);
  });

  it('should have correct styling classes', () => {
    const wrapper = mount(UiSelect, {
      props: { modelValue: 'option1' },
      slots: {
        default: '<option value="option1">Option 1</option>',
      },
    });

    const select = wrapper.find('select');
    const classes = select.classes();

    expect(classes).toContain('block');
    expect(classes).toContain('w-full');
    expect(classes).toContain('rounded');
  });
});
