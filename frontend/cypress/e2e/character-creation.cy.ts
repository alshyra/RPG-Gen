/* eslint-disable max-statements */
describe('Character Creation', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.setupApiMocks();
    cy.mockAuth();
  });

  it("should navigate through all character creation steps", () => {
    cy.visit("/home");
    cy.contains("RPG Gemini").should("be.visible");

    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.url().should("include", "/character/dnd/step/1");
    cy.contains("Informations de base").should("be.visible");

    cy.get('input[placeholder="Ex: Aragorn"]').type("TestHero");

    cy.contains("♂️ Homme").click();

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    cy.contains("Race & Classe").should("be.visible");

    cy.contains("Humain").click();

    cy.get("select").select("Barbarian");

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/3");

    cy.contains("Capacités").should("be.visible");

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/4");

    cy.contains("Compétences").should("be.visible");

    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/5");

    cy.contains("Avatar").should("be.visible");

    cy.contains("button", "Terminer").click();

    cy.url().should("include", "/game/dnd");
    cy.contains("Dungeons & Dragons").should("be.visible");
  });

  it("should save character draft to localStorage", () => {
    cy.visit("/home");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.get('input[placeholder="Ex: Aragorn"]').type("DraftHero");
    cy.contains("♀️ Femme").click();

    cy.wait(600);

    cy.window().then((win) => {
      const draft = win.localStorage.getItem("rpg-character-draft");
      expect(draft).to.exist;
      const draftData = JSON.parse(draft!);
      expect(draftData.character.name).to.equal("DraftHero");
      expect(draftData.gender).to.equal("female");
    });
  });

  it("should restore draft on page refresh", () => {
    cy.visit("/home");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.get('input[placeholder="Ex: Aragorn"]').type("RefreshHero");
    cy.contains("♀️ Femme").click();

    cy.wait(600);

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    cy.reload();

    cy.url().should("include", "/character/dnd/step/2");
    cy.contains("Race & Classe").should("be.visible");
  });

  it("should go back to previous step", () => {
    cy.visit("/home");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.get('input[placeholder="Ex: Aragorn"]').type("BackHero");

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    cy.contains("button", "Retour").click();
    cy.url().should("include", "/character/dnd/step/1");

    cy.get('input[placeholder="Ex: Aragorn"]').should("have.value", "BackHero");
  });

  it("should validate step completion before allowing next", () => {
    cy.visit("/home");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.contains("button", "Suivant").should("be.disabled");

    cy.get('input[placeholder="Ex: Aragorn"]').type("ValidationHero");

    cy.contains("button", "Suivant").should("not.be.disabled");
  });

  it("should persist ability scores (character.scores) on page refresh", () => {
    cy.visit("/home");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.get('input[placeholder="Ex: Aragorn"]').type("ScorePersistHero");
    cy.contains("♂️ Homme").click();

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/2");

    cy.contains("Humain").click();
    cy.get("select").select("Fighter");

    cy.contains("button", "Suivant").click();
    cy.url().should("include", "/character/dnd/step/3");
    cy.contains("Capacités").should("be.visible");

    cy.get('[data-test-id="ability-score-Str"]').contains("-").click();
    cy.get('[data-test-id="ability-score-Dex"]').contains("+").click();
    cy.wait(600);

    cy.window().then((win) => {
      const draft = win.localStorage.getItem("rpg-character-draft");
      expect(draft).to.exist;
      const draftData = JSON.parse(draft!);
      expect(draftData.baseScores).to.exist;
      expect(draftData.baseScores.Str).to.equal(14);
    });

    cy.reload();

    cy.url().should("include", "/character/dnd/step/3");
    cy.contains("Capacités").should("be.visible");

    cy.get('[data-test-id=ability-score-Str] [data-test-id=ability-score]').should('contain', '14');
    cy.get('[data-test-id=ability-score-Dex] [data-test-id=ability-score]').should('contain', '15');

    cy.window().then((win) => {
      const draft = win.localStorage.getItem("rpg-character-draft");
      expect(draft).to.not.be.null;
      const draftData = JSON.parse(draft!);
      expect(draftData.baseScores.Str).to.equal(14);
    });
  });

  it("should auto-generate and save avatar when finishing character creation", () => {
    cy.visit("/home");
    cy.contains("Dungeons & Dragons").closest(".tpl").find("button").contains("Commencer").click();

    cy.get('input[placeholder="Ex: Aragorn"]').type("AutoAvatarHero");
    cy.contains("♂️ Homme").click();
    cy.contains("button", "Suivant").click();

    cy.contains("Humain").click();
    cy.get("select").select("Barbarian");
    cy.contains("button", "Suivant").click();
    cy.contains("button", "Suivant").click();

    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').eq(1).check();
    cy.contains("button", "Suivant").click();

    cy.url().should("include", "/character/dnd/step/5");
    cy.contains("Générer un Avatar").should("be.visible");

    cy.get("textarea").type("Un grand guerrier musclé aux cheveux noirs");

    // Add a test-local intercept to ensure we catch the actual generate-avatar request
    cy.intercept('POST', '**/api/image/generate-avatar*').as('generateAvatarTest');
    // Also intercept character creation locally to ensure we capture it
    cy.intercept('POST', '**/api/characters').as('createCharacterTest');

    cy.contains("button", "Terminer").click();

    // Wait for local alias — the app can trigger generation slightly before we call wait
    cy.wait("@generateAvatarTest").then((interception) => {
      // Ensure the request included the description and charId
      expect(interception.request.body).to.have.property('description');
      expect(interception.request.body).to.have.property('characterId');
    });
    cy.wait("@createCharacterTest").then((interception) => {
      const characterData = interception.request.body;
      // The portrait should either be a generated data URL or the default /images/... path
      expect(characterData.portrait).to.match(/data:image|^\/images\//);
      // The creation request should be authenticated in tests
      expect(interception.request.headers).to.have.property('authorization');
      expect(interception.request.headers.authorization).to.contain('Bearer');
    });

    cy.url().should("include", "/game/dnd");
  });
});
