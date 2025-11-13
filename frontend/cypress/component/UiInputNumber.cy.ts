import UiInputNumber from '../../src/components/ui/UiInputNumber.vue';

describe('UiInputNumber Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default value of 0', () => {
      cy.mount(UiInputNumber);
      cy.contains('0').should('be.visible');
    });

    it('should display the modelValue', () => {
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 10,
        },
      });
      cy.contains('10').should('be.visible');
    });
  });

  describe('Increment/Decrement', () => {
    it('should increment value when + button is clicked', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 5,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('+').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(6);
      });
    });

    it('should decrement value when - button is clicked', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 5,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('-').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(4);
      });
    });
  });

  describe('Min/Max Constraints', () => {
    it('should respect min constraint', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 8,
          min: 8,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('-').should('be.disabled');
      cy.contains('-').click({ force: true });
      cy.wrap(null).then(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(onUpdate).not.to.have.been.called;
      });
    });

    it('should respect max constraint', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 15,
          max: 15,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('+').should('be.disabled');
      cy.contains('+').click({ force: true });
      cy.wrap(null).then(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(onUpdate).not.to.have.been.called;
      });
    });

    it('should not go below min when decrementing', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 9,
          min: 8,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('-').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(8);
      });
    });

    it('should not go above max when incrementing', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 14,
          max: 15,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('+').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(15);
      });
    });
  });

  describe('Step Value', () => {
    it('should use custom step value', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 10,
          step: 5,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('+').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(15);
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable both buttons when disabled prop is true', () => {
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 10,
          disabled: true,
        },
      });

      cy.contains('+').should('be.disabled');
      cy.contains('-').should('be.disabled');
    });
  });

  describe('Range Operations', () => {
    it('should allow increments within range', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 10,
          min: 8,
          max: 15,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('+').should('not.be.disabled').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(11);
      });
    });

    it('should allow decrements within range', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          modelValue: 10,
          min: 8,
          max: 15,
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('-').should('not.be.disabled').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(9);
      });
    });

    it('should handle undefined modelValue gracefully', () => {
      const onUpdate = cy.stub();
      cy.mount(UiInputNumber, {
        props: {
          'onUpdate:modelValue': onUpdate,
        },
      });

      cy.contains('0').should('be.visible');
      cy.contains('+').click();
      cy.wrap(null).then(() => {
        expect(onUpdate).to.have.been.calledWith(1);
      });
    });
  });
});
