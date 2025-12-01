import { mount } from '@vue/test-utils';
import {
  describe, expect, it,
} from 'vitest';
import UiSkeleton from './UiSkeleton.vue';

describe('UiSkeleton', () => {
  it('renders with default text variant', () => {
    const wrapper = mount(UiSkeleton);
    expect(wrapper.find('div')
      .exists())
      .toBe(true);
    expect(wrapper.find('div')
      .classes())
      .toContain('animate-pulse');
    expect(wrapper.find('div')
      .classes())
      .toContain('h-4');
    expect(wrapper.find('div')
      .classes())
      .toContain('w-full');
  });

  it('renders with avatar variant', () => {
    const wrapper = mount(UiSkeleton, { props: { variant: 'avatar' } });
    expect(wrapper.find('div')
      .classes())
      .toContain('h-12');
    expect(wrapper.find('div')
      .classes())
      .toContain('w-12');
    expect(wrapper.find('div')
      .classes())
      .toContain('rounded-full');
  });

  it('renders with card variant', () => {
    const wrapper = mount(UiSkeleton, { props: { variant: 'card' } });
    expect(wrapper.find('div')
      .classes())
      .toContain('h-24');
    expect(wrapper.find('div')
      .classes())
      .toContain('w-full');
  });

  it('has correct accessibility attributes', () => {
    const wrapper = mount(UiSkeleton);
    expect(wrapper.find('div')
      .attributes('role'))
      .toBe('status');
    expect(wrapper.find('div')
      .attributes('aria-label'))
      .toBe('Loading');
  });
});
