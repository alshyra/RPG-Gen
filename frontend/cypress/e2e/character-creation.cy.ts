/* eslint-disable max-statements */
describe("Character Creation", () => {
  beforeEach(() => {
    // Clear localStorage to ensure fresh start
    cy.clearLocalStorage();
  });

  it("should navigate through all character creation steps", () => {
    // Start from home
    cy.visit("/");
    cy.contains("RPG Gemini").should("be.visible");

    // Select a world (D&D)
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    // Should be on step 1 (Basic Info)
    cy.url().should("include", "/character/dnd/step/1");
    cy.contains("Informations de base").should("be.visible");

    // Fill in character name
    cy.get('input[placeholder="Ex: Aragorn"]').type("TestHero");

    // Select gender
    cy.contains("♂️ Homme").click();

    // Go to next step
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    // Should see Race & Class step
    cy.contains("Race & Classe").should("be.visible");

    // Select a race (click the first race button)
    cy.contains("Humain").click();

    // Select a class from the select dropdown
    cy.get("select").select("Barbarian");

    // Go to next step
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/3");

    // Should see Ability Scores step
    cy.contains("Capacités").should("be.visible");

    // Go to next step
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/4");

    // Should see Skills step
    cy.contains("Compétences").should("be.visible");

    // Select required number of skills (should be 2 for some classes)
    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();

    // Go to next step
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/5");

    // Should see Avatar step
    cy.contains("Avatar").should("be.visible");

    // Finish creation
    cy.contains("button", "Terminer").click();

    // Should redirect to game view
    cy.url().should("include", "/game/dnd");
    cy.contains("Dungeons & Dragons").should("be.visible");
  });

  it("should save character draft to localStorage", () => {
    cy.visit("/");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    // Fill in basic info
    cy.get('input[placeholder="Ex: Aragorn"]').type("DraftHero");
    cy.contains("♀️ Femme").click();

    // Wait a bit for the draft to save
    cy.wait(600);

    // Check localStorage contains draft
    cy.window().then((win) => {
      const draft = win.localStorage.getItem("rpg-character-draft");
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(draft).to.exist;
      const draftData = JSON.parse(draft);
      expect(draftData.character.name).to.equal("DraftHero");
      expect(draftData.gender).to.equal("female");
    });
  });

  it("should restore draft on page refresh", () => {
    cy.visit("/");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    // Fill in basic info
    cy.get('input[placeholder="Ex: Aragorn"]').type("RefreshHero");
    cy.contains("♀️ Femme").click();

    // Wait for draft to save
    cy.wait(600);

    // Go to next step
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    // Refresh the page
    cy.reload();

    // Should restore the draft and be on step 2
    cy.url().should("include", "/character/dnd/step/2");
    cy.contains("Race & Classe").should("be.visible");
  });

  it("should go back to previous step", () => {
    cy.visit("/");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    // Fill in basic info
    cy.get('input[placeholder="Ex: Aragorn"]').type("BackHero");

    // Go to next step
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    // Go back
    cy.contains("button", "Retour").click();
    cy.url().should("include", "/character/dnd/step/1");

    // Name should still be there (draft restored)
    cy.get('input[placeholder="Ex: Aragorn"]').should("have.value", "BackHero");
  });

  it("should validate step completion before allowing next", () => {
    cy.visit("/");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    // Try to go next without entering name - button should be disabled
    cy.contains("button", "Suivant").should("be.disabled");

    // Enter name
    cy.get('input[placeholder="Ex: Aragorn"]').type("ValidationHero");

    // Now button should be enabled
    cy.contains("button", "Suivant").should("not.be.disabled");
  });

  it("should persist ability scores (character.scores) on page refresh", () => {
    cy.visit("/");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    // Fill in basic info (Step 1)
    cy.get('input[placeholder="Ex: Aragorn"]').type("ScorePersistHero");
    cy.contains("♂️ Homme").click();

    // Go to step 2 (Race & Class)
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    // Select race and class
    cy.contains("Humain").click();
    cy.get("select").select("Fighter");

    // Go to step 3 (Ability Scores)
    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/3");
    cy.contains("Capacités").should("be.visible");

    // Modify ability scores - find the Str input and change it
    // The AbilityScorePicker uses UiInputNumber components
    cy.get('input[type="number"]').first().clear().type("14");

    // Wait for draft to save
    cy.wait(600);

    // Verify the draft contains the modified scores
    cy.window().then((win) => {
      const draft = win.localStorage.getItem("rpg-character-draft");
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(draft).to.exist;
      const draftData = JSON.parse(draft);
      // Check that baseScores has been updated
      expect(draftData.baseScores).to.exist;
      expect(draftData.baseScores.Str).to.equal(14);
    });

    // Refresh the page
    cy.reload();

    // Should still be on step 3
    cy.url().should("include", "/character/dnd/step/3");
    cy.contains("Capacités").should("be.visible");

    // Verify the score is still 14
    cy.get('input[type="number"]').first().should("have.value", "14");

    // Verify localStorage still has the correct value
    cy.window().then((win) => {
      const draft = win.localStorage.getItem("rpg-character-draft");
      const draftData = JSON.parse(draft);
      expect(draftData.baseScores.Str).to.equal(14);
    });
  });
});
