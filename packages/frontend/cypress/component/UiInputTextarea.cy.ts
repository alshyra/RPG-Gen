import UiInputTextarea from '../../src/components/ui/UiInputTextarea.vue';

describe('UiInputTextarea Component', () => {
  it('should render a textarea element', () => {
    cy.mount(UiInputTextarea);
    cy.get('textarea').should('exist');
  });

  it('should display the modelValue', () => {
    cy.mount(UiInputTextarea, {
      props: {
        modelValue: 'Test Content',
      },
    });
    cy.get('textarea').should('have.value', 'Test Content');
  });

  it('should emit update:modelValue when text is entered', () => {
    const onUpdate = cy.stub();
    cy.mount(UiInputTextarea, {
      props: {
        'modelValue': '',
        'onUpdate:modelValue': onUpdate,
      },
    });

    cy.get('textarea').type('Hello World');

    cy.wrap(null).then(() => {
      expect(onUpdate).to.have.been.calledWith('Hello World');
    });
  });

  it('should accept placeholder prop', () => {
    cy.mount(UiInputTextarea, {
      props: {
        placeholder: 'Enter your description',
      },
    });
    cy.get('textarea').should('have.attr', 'placeholder', 'Enter your description');
  });

  it('should be disabled when disabled prop is true', () => {
    cy.mount(UiInputTextarea, {
      props: {
        disabled: true,
      },
    });
    cy.get('textarea').should('be.disabled');
  });

  it('should not be disabled when disabled prop is false', () => {
    cy.mount(UiInputTextarea, {
      props: {
        disabled: false,
      },
    });
    cy.get('textarea').should('not.be.disabled');
  });

  it('should respect rows prop', () => {
    cy.mount(UiInputTextarea, {
      props: {
        rows: 5,
      },
    });
    cy.get('textarea').should('have.attr', 'rows', '5');
  });
});
