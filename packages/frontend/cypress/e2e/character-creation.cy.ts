/* eslint-disable max-statements */
describe('Character Creation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.ensureAuth();
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
    cy.contains("Inventaire").should("be.visible");

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/6/);
    cy.contains("Avatar").should("be.visible");


    // stub avatar generation and also spy final character save so navigation waits until backend is persisted
    cy.intercept('POST', '/api/image/generate-avatar', { statusCode: 200, body: { imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=' } }).as('generateAvatar');
    cy.intercept('PUT', '**/api/characters/*').as('updateCharacterFinish');

    cy.contains("button", "Terminer").click();
    cy.wait('@generateAvatar');
    cy.wait('@updateCharacterFinish');

    cy.url().should("match", /\/game\/[^/]+/);
  });

  it("should save character draft to the server (draft persisted)", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    // Intercept server update so we can wait for persistence
    cy.intercept('PUT', '**/api/characters/*').as('updateCharacter');
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("DraftHero");
    cy.contains("♀️ Femme").click();

    // Wait for server-side save to complete and ensure the server update included the name
    cy.wait('@updateCharacter').then((interception) => {
      // the UI can emit multiple PUTs (name followed by other small updates). If the first
      // matched request does not include the name, wait for the next one.
      if (interception.request.body?.name !== 'DraftHero') {
        cy.wait('@updateCharacter').its('request.body').should('have.property', 'name', 'DraftHero');
      } else {
        expect(interception.request.body).to.have.property('name', 'DraftHero');
      }
    });

    // clicking gender may trigger another update; wait for it so the server has latest state
    cy.contains("♀️ Femme").click();
    cy.wait('@updateCharacter').its('request.body').should('have.property', 'gender', 'female');

    // Ensure the UI reflected the input
    cy.get('input[placeholder="Ex: Aragorn"]').should("have.value", "DraftHero");

    // Character is persisted server-side as a draft — fetch via the API
    cy.url().should('match', /\/character\/([^/]+)\/step\/1/).then((u) => {
      const match = (u as string).match(/\/character\/([^/]+)\/step\/1/);
      expect(match).to.not.be.null;
      const id = (match as RegExpMatchArray)[1];
      cy.request({ method: 'GET', url: `/api/characters/${id}`, failOnStatusCode: false }).then((resp) => {
        expect(resp.status).to.equal(200);
        expect(resp.body).to.have.property('name', 'DraftHero');
      });
    });
  });

  it("should restore draft on page refresh", () => {
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("match", /\/character\/[^/]+\/step\/1/);
    cy.intercept('PUT', '**/api/characters/*').as('updateCharacter2');
    cy.get('input[placeholder="Ex: Aragorn"]').clear().type("RefreshHero");
    cy.contains("♀️ Femme").click();

    // Wait for server persistence and ensure the update included the name
    cy.wait('@updateCharacter2').then((interception) => {
      if (interception.request.body?.name !== 'RefreshHero') {
        cy.wait('@updateCharacter2').its('request.body').should('have.property', 'name', 'RefreshHero');
      } else {
        expect(interception.request.body).to.have.property('name', 'RefreshHero');
      }
    });

    // clicking gender may trigger another update; ensure it's persisted as well
    cy.contains("♀️ Femme").click();
    cy.wait('@updateCharacter2').its('request.body').should('have.property', 'gender', 'female');

    // The draft should be persisted server-side (avoid fixed wait)
    cy.url().should('match', /\/character\/([^/]+)\/step\/1/).then((u) => {
      const match = (u as string).match(/\/character\/([^/]+)\/step\/1/);
      expect(match).to.not.be.null;
      const id = (match as RegExpMatchArray)[1];
      cy.request({ method: 'GET', url: `/api/characters/${id}`, failOnStatusCode: false }).then((resp) => {
        expect(resp.status).to.equal(200);
        expect(resp.body).to.have.property('name', 'RefreshHero');
      });
    });

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

    // Spy on the save character request so we can ensure the change persisted.
    cy.intercept('PUT', '**/api/characters/*').as('updateCharacter');
    cy.get('[data-test-id="ability-score-Str"]').contains("-").click();
    cy.get('[data-test-id="ability-score-Dex"]').contains("+").click();
    // wait for the updateCharacter intercept to ensure backend persistence
    cy.wait('@updateCharacter');

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

    // Inventory step -> then proceed to Avatar
    cy.url().should("match", /\/character\/[^/]+\/step\/5/);
    cy.contains("Inventaire").should("be.visible");

    cy.contains("button", "Suivant").click();
    cy.url().should("match", /\/character\/[^/]+\/step\/6/);
    cy.contains("Avatar").should("be.visible");

    // The avatar step allows optional description
    cy.contains("button", "Terminer").click();

    // Should navigate to game after finishing
    cy.url().should("match", /\/game\/[^/]+/);
  });
});
