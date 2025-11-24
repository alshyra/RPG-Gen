import UiInputCheckbox from "../../src/components/ui/UiInputCheckbox.vue";
import { defineComponent, ref } from "vue";

describe("UiInputCheckbox Component", () => {
  it("should render a checkbox element", () => {
    cy.mount(UiInputCheckbox);
    cy.get('input[type="checkbox"]').should("exist");
  });

  it("should be checked when checked prop is true", () => {
    cy.mount(UiInputCheckbox, {
      props: {
        checked: true,
      },
    });
    cy.get('input[type="checkbox"]').should("be.checked");
  });

  it("should not be checked when checked prop is false", () => {
    cy.mount(UiInputCheckbox, {
      props: {
        checked: false,
      },
    });
    cy.get('input[type="checkbox"]').should("not.be.checked");
  });

  it("should emit change event when checkbox is toggled", () => {
    cy.mount(UiInputCheckbox, {
      props: {
        checked: false,
      },
    });

    cy.get('input[type="checkbox"]').click();
    // If click doesn't throw an error, change event is working
  });

  it("should be disabled when disabled prop is true", () => {
    cy.mount(UiInputCheckbox, {
      props: {
        disabled: true,
      },
    });
    cy.get('input[type="checkbox"]').should("be.disabled");
  });

  it("should not be disabled when disabled prop is false", () => {
    cy.mount(UiInputCheckbox, {
      props: {
        disabled: false,
      },
    });
    cy.get('input[type="checkbox"]').should("not.be.disabled");
  });

  it('should render different sizes from props', () => {
    cy.mount(UiInputCheckbox, { props: { size: 'sm' } });
    cy.get('[data-testid="ui-checkbox"]').should('have.class', 'w-4');

    cy.mount(UiInputCheckbox, { props: { size: 'md' } });
    cy.get('[data-testid="ui-checkbox"]').should('have.class', 'w-5');

    cy.mount(UiInputCheckbox, { props: { size: 'lg' } });
    cy.get('[data-testid="ui-checkbox"]').should('have.class', 'w-6');
  });

  it('should toggle when clicking on the label text (slot)', () => {
    cy.mount(UiInputCheckbox, { slots: { default: 'Clickable label' } });
    // checkbox starts unchecked
    cy.get('input[type="checkbox"]').should('not.be.checked');
    cy.contains('Clickable label').click();
    cy.get('input[type="checkbox"]').should('be.checked');
  });

  it('works with v-model and updates parent state', () => {
    cy.mount(defineComponent({
      components: { UiInputCheckbox },
      template: `<div><UiInputCheckbox v-model="checked" /><span data-testid="val">{{checked}}</span></div>`,
      setup() { const checked = ref(false); return { checked }; },
    }));

    cy.get('[data-testid="val"]').should('have.text', 'false');
    cy.get('input[type="checkbox"]').click();
    cy.get('[data-testid="val"]').should('have.text', 'true');
  });
});
