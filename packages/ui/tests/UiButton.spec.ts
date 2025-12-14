import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UiButton } from '@rpg-gen/ui';

describe('UiButton Component', () => {
  it('should render with default variant (primary)', () => {
    const wrapper = mount(UiButton, {
      slots: { default: 'Click me' },
    });

    expect(wrapper.text()).toContain('Click me');
    expect(wrapper.find('button').classes()).toContain('bg-gradient-to-r');
    expect(wrapper.find('button').classes()).toContain('from-purple-500');
    expect(wrapper.find('button').classes()).toContain('to-pink-500');
  });

  it('should render with ghost variant', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'ghost' },
      slots: { default: 'Ghost Button' },
    });

    expect(wrapper.text()).toContain('Ghost Button');
    expect(wrapper.find('button').classes()).toContain('bg-white/10');
    expect(wrapper.find('button').classes()).toContain('text-white');
  });

  it('should be clickable', async () => {
    const onClickSpy = vi.fn();

    const wrapper = mount(UiButton, {
      props: { onClick: onClickSpy },
      slots: { default: 'Click me' },
    });

    await wrapper.find('button').trigger('click');
    expect(onClickSpy).toHaveBeenCalledOnce();
  });

  it('should render with custom classes', () => {
    const wrapper = mount(UiButton, {
      slots: { default: 'Styled Button' },
    });

    const button = wrapper.find('button');
    expect(button.classes()).toContain('inline-flex');
    expect(button.classes()).toContain('items-center');
    expect(button.classes()).toContain('px-3');
    expect(button.classes()).toContain('py-1');
    expect(button.classes()).toContain('rounded-md');
    expect(button.classes()).toContain('font-semibold');
    expect(button.classes()).toContain('shadow-sm');
  });
});
