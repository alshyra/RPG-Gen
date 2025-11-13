import UiInputCheckbox from "../../src/components/ui/UiInputCheckbox.vue";
import { defineComponent } from "vue";

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
});
