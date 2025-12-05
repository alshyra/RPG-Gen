import { mount } from '@vue/test-utils';
import {
  describe, expect, it,
} from 'vitest';
import UiButton from './UiButton.vue';

describe('UiButton', () => {
  it('renders with default variant', () => {
    const wrapper = mount(UiButton, { slots: { default: 'Click me' } });
    expect(wrapper.text())
      .toBe('Click me');
    expect(wrapper.find('button')
      .classes())
      .toContain('bg-gradient-to-r');
  });

  it('renders with ghost variant', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'ghost' },
      slots: { default: 'Click me' },
    });
    expect(wrapper.find('button')
      .classes())
      .toContain('bg-white/10');
  });

  it('shows loading spinner when isLoading is true', () => {
    const wrapper = mount(UiButton, {
      props: { isLoading: true },
      slots: { default: 'Loading...' },
    });
    expect(wrapper.find('.animate-spin')
      .exists())
      .toBe(true);
    expect(wrapper.find('button')
      .attributes('disabled'))
      .toBeDefined();
  });

  it('is disabled when isLoading is true', () => {
    const wrapper = mount(UiButton, {
      props: { isLoading: true },
      slots: { default: 'Click me' },
    });
    expect(wrapper.find('button')
      .attributes('disabled'))
      .toBeDefined();
  });

  it('applies disabled styles when loading', () => {
    const wrapper = mount(UiButton, {
      props: { isLoading: true },
      slots: { default: 'Click me' },
    });
    const buttonClasses = wrapper.find('button')
      .classes()
      .join(' ');
    expect(buttonClasses)
      .toContain('opacity-50');
    expect(buttonClasses)
      .toContain('cursor-not-allowed');
  });

  it('applies disabled styles when explicitly disabled', () => {
    const wrapper = mount(UiButton, {
      props: { disabled: true },
      slots: { default: 'Click me' },
    });
    const buttonClasses = wrapper.find('button')
      .classes()
      .join(' ');
    expect(buttonClasses)
      .toContain('opacity-50');
    expect(buttonClasses)
      .toContain('cursor-not-allowed');
  });

  it('does not show spinner when not loading', () => {
    const wrapper = mount(UiButton, {
      props: { isLoading: false },
      slots: { default: 'Click me' },
    });
    expect(wrapper.find('.animate-spin')
      .exists())
      .toBe(false);
  });
});
