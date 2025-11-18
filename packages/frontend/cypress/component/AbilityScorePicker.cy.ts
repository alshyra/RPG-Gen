import AbilityScorePicker from "../../src/components/character-stats/AbilityScorePicker.vue";
import { createPinia, setActivePinia } from "pinia";
import { useCharacterStore } from "../../src/composables/characterStore";

describe("AbilityScorePicker", () => {
  it("renders abilities and shows remaining points (point-buy)", () => {
    cy.mount(AbilityScorePicker);
    cy.contains("Str").should("be.visible");
    cy.contains("Dex").should("be.visible");
    cy.contains(/Points restants/i)
      .should("be.visible")
      .and("contain.text", "0");
  });

  it("prevents overspend in point-buy and allows cost reductions", () => {
    const onUpdate = cy.stub();
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useCharacterStore();
    (store.currentCharacter as any).value = {
      scores: { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 },
    };
    cy.mount(AbilityScorePicker, { global: { plugins: [pinia] } });

    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains("-").click();
    });

    cy.wrap(null).then(() => {
      expect(store.currentCharacter.scores?.Str).to.equal(14);
    });

    cy.get('[data-test-id="ability-score-Wis"]').within(() => {
      cy.contains("+").click();
    });

    cy.wrap(null).then(() => {
      expect(store.currentCharacter.scores?.Wis).to.equal(11);
    });
  });

  it("enforces level-up budget in levelup mode", () => {
    const onUpdate = cy.stub();
    const initialScores = { Str: 10, Dex: 10, Con: 10, Int: 10, Wis: 10, Cha: 10 };
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useCharacterStore();
    (store.currentCharacter as any).value = { scores: { ...initialScores } };
    cy.mount(AbilityScorePicker, {
      global: { plugins: [pinia] },
      props: { mode: "levelup", initialScores, levelUpBudget: 2 },
    });

    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains("+").click();
    });

    cy.wrap(null).then(() => {
      expect(store.currentCharacter.scores?.Str).to.equal(11);
    });

    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains("+").click();
    });

    cy.wrap(null).then(() => {
      expect(store.currentCharacter.scores?.Str).to.equal(12);
    });

    cy.wait(50);
    const callsBefore = onUpdate.callCount;
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains("+").click();
    });

    cy.wrap(null).then(() => {
      cy.get('[data-test-id="ability-score-Str"]').should("contain.text", "12");
    });
  });

  it("shows static values in edit mode", () => {
    const scores = { Str: 16, Dex: 12, Con: 12, Int: 10, Wis: 10, Cha: 8 };
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useCharacterStore();
    (store.currentCharacter as any).value = { scores } as any;
    cy.mount(AbilityScorePicker, { global: { plugins: [pinia] }, props: { mode: "edit" } });

    cy.get('[data-test-id="ability-score-Str"]').should("contain.text", "16");
    cy.get('[data-test-id="ability-score-Str"]').within(() => {
      cy.contains("+").should("not.exist");
    });
  });

  it("displays proficiency bonus when provided", () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useCharacterStore();
    (store.currentCharacter as any).value = {} as any;
    cy.mount(AbilityScorePicker, { global: { plugins: [pinia] }, props: { proficiency: 3 } });

    cy.contains("PB 3").should("be.visible");
  });
});
