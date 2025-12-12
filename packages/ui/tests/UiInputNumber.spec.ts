import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UiInputNumber } from '@rpg-gen/ui';

describe('UiInputNumber Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default value of 0', () => {
      const wrapper = mount(UiInputNumber);
      expect(wrapper.text()).toContain('0');
    });

    it('should display the modelValue', () => {
      const wrapper = mount(UiInputNumber, {
        props: { modelValue: 10 },
      });
      expect(wrapper.text()).toContain('10');
    });
  });

  describe('Increment/Decrement', () => {
    it('should increment value when + button is clicked', async () => {
      const onUpdate = vi.fn();
      const wrapper = mount(UiInputNumber, {
        props: {
          modelValue: 5,
          'onUpdate:modelValue': onUpdate,
        },
      });

      await wrapper
        .findAll('button')
        .find(btn => btn.text() === '+')
        ?.trigger('click');
      expect(onUpdate).toHaveBeenCalledWith(6);
    });

    it('should decrement value when - button is clicked', async () => {
      const onUpdate = vi.fn();
      const wrapper = mount(UiInputNumber, {
        props: {
          modelValue: 5,
          'onUpdate:modelValue': onUpdate,
        },
      });

      await wrapper
        .findAll('button')
        .find(btn => btn.text() === '-')
        ?.trigger('click');
      expect(onUpdate).toHaveBeenCalledWith(4);
    });
  });

  describe('Min/Max Constraints', () => {
    it('should respect min constraint', () => {
      const wrapper = mount(UiInputNumber, {
        props: {
          modelValue: 9,
          min: 9,
        },
      });

      const minusButton = wrapper.findAll('button').find(btn => btn.text() === '-');
      expect(minusButton?.attributes('disabled')).toBeDefined();
    });

    it('should respect max constraint', () => {
      const wrapper = mount(UiInputNumber, {
        props: {
          modelValue: 15,
          max: 15,
        },
      });

      const plusButton = wrapper.findAll('button').find(btn => btn.text() === '+');
      expect(plusButton?.attributes('disabled')).toBeDefined();
    });

    it('should not go below min when decrementing', async () => {
      const onUpdate = vi.fn();
      const wrapper = mount(UiInputNumber, {
        props: {
          modelValue: 9,
          min: 8,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const minusButton = wrapper.findAll('button').find(btn => btn.text() === '-');
      await minusButton?.trigger('click');

      expect(onUpdate).toHaveBeenCalledWith(8);

      // Try to go below min
      await minusButton?.trigger('click');
      // Should not emit value below min
      expect(onUpdate).not.toHaveBeenCalledWith(7);
    });

    it('should not go above max when incrementing', async () => {
      const onUpdate = vi.fn();
      const wrapper = mount(UiInputNumber, {
        props: {
          modelValue: 14,
          max: 15,
          'onUpdate:modelValue': onUpdate,
        },
      });

      const plusButton = wrapper.findAll('button').find(btn => btn.text() === '+');
      await plusButton?.trigger('click');

      expect(onUpdate).toHaveBeenCalledWith(15);

      // Try to go above max
      await plusButton?.trigger('click');
      // Should not emit value above max
      expect(onUpdate).not.toHaveBeenCalledWith(16);
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      const wrapper = mount(UiInputNumber, {
        props: { disabled: true },
      });

      const buttons = wrapper.findAll('button');
      buttons.forEach(btn => {
        expect(btn.attributes('disabled')).toBeDefined();
      });
    });
  });
});
