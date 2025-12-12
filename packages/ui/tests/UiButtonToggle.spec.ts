import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UiButtonToggle } from '@rpg-gen/ui';

describe('UiButtonToggle Component', () => {
  it('should render all options', () => {
    const options = [
      {
        value: 'option1',
        label: 'Option 1',
      },
      {
        value: 'option2',
        label: 'Option 2',
      },
      {
        value: 'option3',
        label: 'Option 3',
      },
    ];

    const wrapper = mount(UiButtonToggle, { props: { options } });

    expect(wrapper.text()).toContain('Option 1');
    expect(wrapper.text()).toContain('Option 2');
    expect(wrapper.text()).toContain('Option 3');
  });

  it('should highlight the selected option with primary variant', () => {
    const options = [
      {
        value: 'option1',
        label: 'Option 1',
      },
      {
        value: 'option2',
        label: 'Option 2',
      },
    ];

    const wrapper = mount(UiButtonToggle, {
      props: {
        options,
        modelValue: 'option1',
      },
    });

    const buttons = wrapper.findAll('button');
    const option1Button = buttons.find(btn => btn.text() === 'Option 1');
    const option2Button = buttons.find(btn => btn.text() === 'Option 2');

    expect(option1Button?.classes()).toContain('bg-gradient-to-r');
    expect(option1Button?.classes()).toContain('from-purple-500');
    expect(option1Button?.classes()).toContain('to-pink-500');

    expect(option2Button?.classes()).toContain('bg-white/10');
  });

  it('should emit update:modelValue when an option is clicked', async () => {
    const onUpdate = vi.fn();
    const options = [
      {
        value: 'option1',
        label: 'Option 1',
      },
      {
        value: 'option2',
        label: 'Option 2',
      },
    ];

    const wrapper = mount(UiButtonToggle, {
      props: {
        options,
        modelValue: 'option1',
        'onUpdate:modelValue': onUpdate,
      },
    });

    const option2Button = wrapper.findAll('button').find(btn => btn.text() === 'Option 2');
    await option2Button?.trigger('click');

    expect(onUpdate).toHaveBeenCalledWith('option2');
  });

  it('should update active state when modelValue changes', async () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];

    const wrapper = mount(UiButtonToggle, {
      props: {
        options,
        modelValue: 'option1',
      },
    });

    let option1Button = wrapper.findAll('button').find(btn => btn.text() === 'Option 1');
    expect(option1Button?.classes()).toContain('bg-gradient-to-r');

    // Change modelValue
    await wrapper.setProps({ modelValue: 'option2' });

    const option2Button = wrapper.findAll('button').find(btn => btn.text() === 'Option 2');
    expect(option2Button?.classes()).toContain('bg-gradient-to-r');
  });

  it('should work with icons in options', () => {
    const options = [
      {
        value: 'option1',
        label: '✓ Yes',
      },
      {
        value: 'option2',
        label: '✗ No',
      },
    ];

    const wrapper = mount(UiButtonToggle, { props: { options } });

    expect(wrapper.text()).toContain('✓ Yes');
    expect(wrapper.text()).toContain('✗ No');
  });
});
