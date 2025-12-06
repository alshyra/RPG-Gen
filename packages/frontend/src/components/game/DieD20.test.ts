import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import DieD20 from './DieD20.vue';

describe('DieD20', () => {
  it('renders placeholder when value is missing', () => {
    const wrapper = mount(DieD20, { props: { value: null } });
    expect(wrapper.get('[data-cy="d20"]')
      .text())
      .toContain('-');
  });

  it('renders numeric value when provided', () => {
    const wrapper = mount(DieD20, { props: { value: 18 } });
    expect(wrapper.get('[data-cy="d20"]')
      .text())
      .toContain('18');
  });

  it('displays 20 with success visuals and shows raster image', () => {
    const wrapper = mount(DieD20, {
      props: {
        value: 20,
        size: 120,
      },
    });
    // overlay text and PNG presence
    expect(wrapper.get('[data-cy="d20"]')
      .text())
      .toContain('20');
    const img = wrapper.find('img.d20-raster');
    expect(img.exists())
      .toBe(true);
    expect(img.attributes('src'))
      .toContain('/images/d20.png');
    expect(wrapper.classes())
      .toContain('crit-success');
  });

  it('renders fail state for 1 (red visuals and class)', () => {
    const wrapper = mount(DieD20, { props: { value: 1 } });
    expect(wrapper.get('[data-cy="d20"]')
      .text())
      .toContain('1');
    const img = wrapper.find('img.d20-raster');
    expect(img.exists())
      .toBe(true);
    expect(wrapper.classes())
      .toContain('crit-fail');
  });
});
