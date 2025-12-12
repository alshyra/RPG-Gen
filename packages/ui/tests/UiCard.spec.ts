import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { UiCard } from '@rpg-gen/ui';

describe('UiCard Component', () => {
  it('should render with default styling', () => {
    const wrapper = mount(UiCard, {
      slots: { default: 'Card content' },
    });

    expect(wrapper.text()).toContain('Card content');
  });

  it('should render slot content', () => {
    const wrapper = mount(UiCard, {
      slots: { default: '<div>Test content <strong>with HTML</strong></div>' },
    });

    expect(wrapper.text()).toContain('Test content');
    expect(wrapper.find('strong').text()).toBe('with HTML');
  });

  it('should have correct styling classes', () => {
    const wrapper = mount(UiCard, {
      slots: { default: 'Content' },
    });

    const classes = wrapper.find('div').classes();
    expect(classes).toContain('bg-slate-900/60');
    expect(classes).toContain('backdrop-blur-sm');
    expect(classes).toContain('rounded-lg');
    expect(classes).toContain('p-4');
    expect(classes).toContain('shadow-lg');
    expect(classes).toContain('border');
    expect(classes).toContain('border-slate-800/50');
  });

  it('should render multiple child elements', () => {
    const wrapper = mount(UiCard, {
      slots: {
        default: `
          <h1>Title</h1>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        `,
      },
    });

    expect(wrapper.find('h1').text()).toBe('Title');
    expect(wrapper.findAll('p')[0].text()).toBe('Paragraph 1');
    expect(wrapper.findAll('p')[1].text()).toBe('Paragraph 2');
  });

  it('should render nested components', () => {
    const wrapper = mount(UiCard, {
      slots: { default: '<button>Click me</button>' },
    });

    const button = wrapper.find('button');
    expect(button.text()).toBe('Click me');
    expect(button.exists()).toBe(true);
  });
});
