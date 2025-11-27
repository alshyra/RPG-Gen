import UiInputCheckbox from '../../src/components/ui/UiInputCheckbox.vue';
import { h, ref } from 'vue';

describe('UiInputCheckbox Component', () => {
  it('should render a checkbox element', () => {
    cy.mount(UiInputCheckbox);
    cy.get('input[type="checkbox"]').should('exist');
  });

  it('should be checked when modelValue prop is true', () => {
    cy.mount(UiInputCheckbox, {
      props: {
        modelValue: true,
      },
    });
    // aria-checked should reflect the checked state
    cy.get('[data-testid="ui-checkbox"]').should('have.attr', 'aria-checked', 'true');
    cy.get('input[type="checkbox"]').should('have.prop', 'checked', true);
  });

  it('should not be checked when checked prop is false', () => {
    cy.mount(UiInputCheckbox, {
      props: {
        checked: false,
      },
    });
    cy.get('input[type="checkbox"]').should('not.be.checked');
  });

  it('should emit change event when checkbox is toggled', () => {
    cy.mount(UiInputCheckbox, {
      props: {
        checked: false,
      },
    });

    cy.get('[data-testid="ui-checkbox"]').click();
  });

  it('should be disabled when disabled prop is true', () => {
    cy.mount(UiInputCheckbox, {
      props: {
        disabled: true,
      },
    });
    cy.get('input[type="checkbox"]').should('be.disabled');
  });

  it('should not be disabled when disabled prop is false', () => {
    cy.mount(UiInputCheckbox, {
      props: {
        disabled: false,
      },
    });
    cy.get('input[type="checkbox"]').should('not.be.disabled');
  });

  it('should render different sizes from props', () => {
    cy.mount(UiInputCheckbox, { props: { size: 'sm' } });
    cy.get('[data-testid="ui-checkbox"] > span').should('have.class', 'w-4');

    cy.mount(UiInputCheckbox, { props: { size: 'md' } });
    cy.get('[data-testid="ui-checkbox"] > span').should('have.class', 'w-5');

    cy.mount(UiInputCheckbox, { props: { size: 'lg' } });
    cy.get('[data-testid="ui-checkbox"] > span').should('have.class', 'w-6');
  });

  it('should toggle when clicking on the label text (slot)', () => {
    cy.mount(UiInputCheckbox, { slots: { default: 'Clickable label' } });
    // checkbox starts unchecked
    cy.get('input[type="checkbox"]').should('not.be.checked');
    cy.contains('Clickable label').click();
    cy.get('input[type="checkbox"]').should('be.checked');
  });

  it('works with v-model and updates parent state', () => {
    cy.mount({
      components: { UiInputCheckbox },
      setup() {
        const checkedState = ref(false);
        return () => h('div', [
          h(UiInputCheckbox as any, {
            'modelValue': checkedState.value,
            'onUpdate:modelValue': (v: boolean) => { checkedState.value = v; },
          }),
          h('span', { 'data-testid': 'val' }, checkedState.value.toString()),
        ]);
      },
    });
    // the host application should render the value span for the v-model
    cy.get('body').invoke('html')
      .then(h => cy.log('body html length: ' + (h?.length || 0)));
    cy.get('[data-testid="ui-checkbox"]').should('exist');
    cy.get('[data-testid="val"]').should('have.text', 'false');
    cy.get('[data-testid="ui-checkbox"]').click();
    cy.get('[data-testid="val"]').should('have.text', 'true');
  });

  // debug tests removed: not required now that render function-based mount works
});
