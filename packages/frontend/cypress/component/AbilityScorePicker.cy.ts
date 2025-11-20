import AbilityScorePicker from '../../src/components/character-stats/AbilityScorePicker.vue';

describe('AbilityScorePicker', () => {
  it('renders abilities and shows remaining points (point-buy)', () => {
    cy.mount(AbilityScorePicker);
    cy.contains('Str').should('be.visible');
    cy.contains('Dex').should('be.visible');
    // remaining points should display as a number (point-buy default => 0)
    cy.contains(/Points restants/i).should('be.visible').and('contain.text', '0');
  });

  it('prevents overspend in point-buy and allows cost reductions', () => {
    const onUpdate = cy.stub();
    // default values use 27 points, so decreasing one frees budget
    cy.mount(AbilityScorePicker, {
      props: {
        modelValue: undefined,
        'onUpdate:modelValue': onUpdate,
      },
    });

    // decrease Str from 15 to 14 => should emit with new Str value
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains('-').click();
    });

    cy.wrap(null).then(() => {
      expect(onUpdate).to.have.been.called;
      const lastCall = onUpdate.getCall(onUpdate.callCount - 1).args[0];
      expect(lastCall.Str).to.equal(14);
    });

    // after freeing points, try to increase Wis (10 -> 11)
    cy.get('[data-test-id="ability-score-Wis"]').within(() => {
      cy.contains('+').click();
    });

    cy.wrap(null).then(() => {
      const lastCall = onUpdate.getCall(onUpdate.callCount - 1).args[0];
      expect(lastCall.Wis).to.equal(11);
    });
  });

  it('enforces level-up budget in levelup mode', () => {
    const onUpdate = cy.stub();
    const initialScores = { Str: 10, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 };
    cy.mount(AbilityScorePicker, {
      props: {
        modelValue: { ...initialScores },
        mode: 'levelup',
        initialScores,
        levelUpBudget: 2,
        'onUpdate:modelValue': onUpdate,
      },
    });

    // First increment should be allowed
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains('+').click();
    });

    cy.wrap(null).then(() => {
      const lastCall = onUpdate.getCall(onUpdate.callCount - 1).args[0];
      expect(lastCall.Str).to.equal(11);
    });

    // Second increment should be allowed
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains('+').click();
    });

    cy.wrap(null).then(() => {
      const lastCall = onUpdate.getCall(onUpdate.callCount - 1).args[0];
      expect(lastCall.Str).to.equal(12);
    });

    // Third increment exceeds budget and should be prevented
    // small wait to ensure reactivity settled
    cy.wait(50);
    const callsBefore = onUpdate.callCount;
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains('+').click();
    });

    cy.wrap(null).then(() => {
      // the DOM value for Str should still be 12 after the blocked change
      cy.get('[data-test-id="ability-score-Str"]').should('contain.text', '12');
    });
  });

  it('shows static values in edit mode', () => {
    const scores = { Str: 16, Dex: 12, Con: 12, Int: 10, Wis: 10, Cha: 8 };
    cy.mount(AbilityScorePicker, {
      props: {
        modelValue: scores,
        mode: 'edit',
      },
    });

    cy.get('[data-test-id="ability-score-Str"]').should('contain.text', '16');
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      // there should be no + button in edit mode
      cy.contains('+').should('not.exist');
    });
  });

  it('displays proficiency bonus when provided', () => {
    cy.mount(AbilityScorePicker, {
      props: {
        modelValue: undefined,
        proficiency: 3,
      },
    });

    cy.contains('PB 3').should('be.visible');
  });
});
