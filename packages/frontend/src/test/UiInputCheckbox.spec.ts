import { mount } from '@vue/test-utils';
import UiInputCheckbox from '../components/ui/UiInputCheckbox.vue';
import { describe, expect, it } from 'vitest';

describe('UiInputCheckbox unit tests', () => {
  it('is checked when modelValue prop is true', () => {
    const wrapper = mount(UiInputCheckbox as any, { props: { modelValue: true } });
    const input = wrapper.get('input[type="checkbox"]');
    expect((input.element as HTMLInputElement).checked).toBe(true);
    const label = wrapper.get('[data-testid="ui-checkbox"]');
    expect(label.attributes()['aria-checked']).toBe('true');
  });
});
