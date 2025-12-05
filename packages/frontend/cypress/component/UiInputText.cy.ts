import UiInputText from '../../src/components/ui/UiInputText.vue';

describe('UiInputText Component', () => {
  it('should render an input element', () => {
    cy.mount(UiInputText);
    cy.get('input[type="text"]')
      .should('exist');
  });

  it('should display the modelValue', () => {
    cy.mount(UiInputText, { props: { modelValue: 'Test Value' } });
    cy.get('input[type="text"]')
      .should('have.value', 'Test Value');
  });

  it('should emit update:modelValue when text is entered', () => {
    const onUpdate = cy.stub();
    cy.mount(UiInputText, {
      props: {
        'modelValue': '',
        'onUpdate:modelValue': onUpdate,
      },
    });

    cy.get('input[type="text"]')
      .type('Hello World');

    // Verify the emit was called with the correct value
    cy.wrap(null)
      .then(() => {
        expect(onUpdate).to.have.been.calledWith('Hello World');
      });
  });

  it('should accept placeholder prop', () => {
    cy.mount(UiInputText, { props: { placeholder: 'Enter your name' } });
    cy.get('input[type="text"]')
      .should('have.attr', 'placeholder', 'Enter your name');
  });

  it('should be disabled when disabled prop is true', () => {
    cy.mount(UiInputText, { props: { disabled: true } });
    cy.get('input[type="text"]')
      .should('be.disabled');
  });

  it('should not be disabled when disabled prop is false', () => {
    cy.mount(UiInputText, { props: { disabled: false } });
    cy.get('input[type="text"]')
      .should('not.be.disabled');
  });
});
