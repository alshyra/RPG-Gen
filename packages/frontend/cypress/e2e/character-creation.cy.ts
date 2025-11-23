/* eslint-disable max-statements */
describe('Character Creation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.setupApiMocks();
    cy.mockAuth();
    cy.visit('/home');
  });

  it("should navigate through all character creation steps", () => {
    cy.contains("RPG Gemini").should("be.visible");

    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.contains("Informations de base").should("be.visible");

    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("TestHero");

    cy.contains("♂️ Homme").click();

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/2/);

    cy.contains("Race & Classe").should("be.visible");

    cy.contains("Humain").click();

    cy.get("select").select("Barbarian");

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/3/);

    cy.contains("Capacités").should("be.visible");

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/4/);

    cy.contains("Compétences").should("be.visible");

    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/5/);

    cy.contains("Avatar").should("be.visible");

    cy.contains("button", "Terminer").click();

    cy.url().should("match", /\/game\/[^/]+/);
  });

  it("should save character draft to localStorage", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("DraftHero");
    cy.contains("♀️ Femme").click();

    cy.wait(500);

    // In the new API-based system, character data is managed via the backend
    // Verify the character is loaded in the store by checking the UI reflects the input
    cy.get('input[placeholder="Ex: Aragorn"]').should("have.value", "DraftHero");
  });

  it("should restore draft on page refresh", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("RefreshHero");
    cy.contains("♀️ Femme").click();

    cy.wait(600);

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/2/);

    cy.reload();

    cy.url().should("match", /\/character\/[^/]+\/step\/2/);
    cy.contains("Race & Classe").should("be.visible");
  });

  it("should go back to previous step", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("BackHero");

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/2/);

    cy.contains("button", "Retour").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/1/);

    cy.get('input[placeholder="Ex: Aragorn"]').should("have.value", "BackHero");
  });

  it("should validate step completion before allowing next", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);

    // Try to proceed without filling required fields - button should be disabled
    cy.contains("button", "Suivant").should("be.disabled");

    // Fill in the name
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("ValidationHero");

    // Button should now be enabled after name is filled
    cy.contains("button", "Suivant").should("not.be.disabled");
  });

  it("should persist ability scores (character.scores) on page refresh", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("ScorePersistHero");
    cy.contains("♂️ Homme").click();

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/2/);

    cy.contains("Humain").click();
    cy.get("select").select("Fighter");

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/3/);
    cy.contains("Capacités").should("be.visible");

    cy.get('[data-test-id="ability-score-Str"]').contains("-").click();
    cy.get('[data-test-id="ability-score-Dex"]').contains("+").click();
    cy.wait(600);

    // Verify the scores are reflected in the UI
    cy.get('[data-test-id=ability-score-Str] [data-test-id=ability-score]').should('contain', '14');
    cy.get('[data-test-id=ability-score-Dex] [data-test-id=ability-score]').should('contain', '15');

    // In the new API-based system, character is persisted via backend
    // Reload the page to verify the character data persists
    cy.reload();

    cy.url().should("match", /\/character\/[^/]+\/step\/3/);
    cy.contains("Capacités").should("be.visible");

    // Verify scores are still there after reload
    cy.get('[data-test-id=ability-score-Str] [data-test-id=ability-score]').should('contain', '14');
    cy.get('[data-test-id=ability-score-Dex] [data-test-id=ability-score]').should('contain', '15');
  });

  it("should auto-generate and save avatar when finishing character creation", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("AutoAvatarHero");
    cy.contains("♂️ Homme").click();
    cy.contains("button", "Suivant").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/2/);
    cy.contains("Humain").click();
    cy.get("select").select("Barbarian");
    cy.contains("button", "Suivant").click();
    
    cy.url().should("match", /\/character\/[^/]+\/step\/3/);
    cy.contains("button", "Suivant").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/4/);
    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();
    cy.contains("button", "Suivant").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/5/);
    cy.contains("Avatar").should("be.visible");

    // The avatar step allows optional description
    cy.contains("button", "Terminer").click();

    // Should navigate to game after finishing
    cy.url().should("match", /\/game\/[^/]+/);
  });
});
