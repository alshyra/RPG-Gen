import UiSelect from '../../src/components/ui/UiSelect.vue';

describe('UiSelect Component', () => {
  it('should render a select element', () => {
    cy.mount(UiSelect, {
      props: {
        modelValue: 'option1',
      },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        `,
      },
    });

    cy.get('select').should('exist');
  });

  it('should display the selected value', () => {
    cy.mount(UiSelect, {
      props: {
        modelValue: 'option2',
      },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        `,
      },
    });

    cy.get('select').should('have.value', 'option2');
  });

  it('should emit update:modelValue when selection changes', () => {
    const onUpdate = cy.stub();
    cy.mount(UiSelect, {
      props: {
        modelValue: 'option1',
        'onUpdate:modelValue': onUpdate,
      },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        `,
      },
    });

    cy.get('select').select('option2');
    cy.wrap(null).then(() => {
      expect(onUpdate).to.have.been.calledWith('option2');
    });
  });

  it('should render multiple options', () => {
    cy.mount(UiSelect, {
      props: {
        modelValue: 'option1',
      },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
          <option value="option4">Option 4</option>
        `,
      },
    });

    cy.get('select option').should('have.length', 4);
  });

  it('should allow changing selection multiple times', () => {
    const onUpdate = cy.stub();
    cy.mount(UiSelect, {
      props: {
        modelValue: 'option1',
        'onUpdate:modelValue': onUpdate,
      },
      slots: {
        default: `
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        `,
      },
    });

    cy.get('select').select('option2');
    cy.get('select').select('option3');
    cy.get('select').select('option1');

    cy.wrap(null).then(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(onUpdate).to.have.been.calledThrice;
      expect(onUpdate.firstCall).to.have.been.calledWith('option2');
      expect(onUpdate.secondCall).to.have.been.calledWith('option3');
      expect(onUpdate.thirdCall).to.have.been.calledWith('option1');
    });
  });

  it('should have correct styling classes', () => {
    cy.mount(UiSelect, {
      props: {
        modelValue: 'test',
      },
      slots: {
        default: '<option value="test">Test</option>',
      },
    });

    cy.get('select')
      .should('have.class', 'block')
      .and('have.class', 'w-full')
      .and('have.class', 'rounded')
      .and('have.class', 'border')
      .and('have.class', 'border-slate-700')
      .and('have.class', 'bg-slate-800/60')
      .and('have.class', 'cursor-pointer');
  });
});
