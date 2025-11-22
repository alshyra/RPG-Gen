// ***********************************************************
// This file is processed and loaded automatically before your e2e test files.
//
// You can change the location of this file or turn off loading
// support files with the 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Prevent uncaught exceptions from failing tests (like network errors to backend)
Cypress.on("uncaught:exception", (err) => {
  // Ignore network errors and Google OAuth redirect errors during tests
  if (
    err.message.includes("Network") ||
    err.message.includes("fetch") ||
    err.message.includes("Failed to fetch")
  ) {
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Set up authentication mocking utilities
Cypress.Commands.add("mockAuth", () => {
  const mockToken = "test-jwt-token-cypress-mock";
  const mockUser = {
    id: "test-user-123",
    email: "test@example.com",
    displayName: "Test User",
    picture: "https://via.placeholder.com/150",
  };

  // Set items that will be automatically applied on next visit
  cy.window().then((win) => {
    win.localStorage.setItem("rpg-auth-token", mockToken);
    win.localStorage.setItem("rpg-user-data", JSON.stringify(mockUser));
  });
});

Cypress.Commands.add("clearAuth", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("rpg-auth-token");
    win.localStorage.removeItem("rpg-user-data");
  });
});

// Helper to setup API mocks - call this in beforeEach of each test
Cypress.Commands.add("setupApiMocks", () => {
  // Mock a character that can be used for testing - use a mutable object to track state
  let currentCharacter = {
    characterId: "test-char-id-123",
    name: "",
    race: { id: "", name: "", mods: {} },
    scores: { Str: 15, Dex: 14, Con: 13, Int: 12, Wis: 10, Cha: 8 },
    hp: 12,
    hpMax: 12,
    totalXp: 0,
    classes: [],
    skills: [],
    world: "dnd",
    portrait: "",
    gender: "",
    proficiency: 2,
    state: "draft",
  };

  // Auth endpoints
  cy.intercept("GET", "**/api/auth/profile", {
    statusCode: 200,
    body: { id: "test", email: "test@example.com", displayName: "Test User" },
  });

  // Character CRUD endpoints
  cy.intercept("GET", "**/api/characters", {
    statusCode: 200,
    body: [],
  }).as("getCharacters");

  cy.intercept("POST", "**/api/characters", (req) => {
    currentCharacter = { ...currentCharacter, ...req.body };
    req.reply({
      statusCode: 200,
      body: currentCharacter,
    });
  }).as("createCharacter");

  cy.intercept("GET", "**/api/characters/*", (req) => {
    req.reply({
      statusCode: 200,
      body: currentCharacter,
    });
  }).as("getCharacter");

  cy.intercept("PUT", "**/api/characters/*", (req) => {
    currentCharacter = { ...currentCharacter, ...req.body };
    req.reply({
      statusCode: 200,
      body: currentCharacter,
    });
  }).as("updateCharacter");

  cy.intercept("DELETE", "**/api/characters/*", {
    statusCode: 200,
    body: null,
  }).as("deleteCharacter");

  cy.intercept("POST", "**/api/characters/*/kill", (req) => {
    req.reply({
      statusCode: 200,
      body: currentCharacter,
    });
  }).as("killCharacter");

  cy.intercept("GET", "**/api/characters/deceased", {
    statusCode: 200,
    body: [],
  }).as("getDeceasedCharacters");

  // Chat/Game endpoints
  // Match both trailing slash and query-string variants of /api/chat/history
  cy.intercept("GET", "**/api/chat/history*", {
    statusCode: 200,
    body: { isNew: true, history: [] },
  }).as("getChatHistory");

  cy.intercept("POST", "**/api/chat", {
    statusCode: 200,
    body: {
      result: {
        text: "Mock game response",
        instructions: [],
      },
    },
  }).as("sendChat");

  // Image generation endpoint - match generate-avatar exactly and any additional path variants
  cy.intercept("POST", "**/api/image/generate-avatar*", {
    statusCode: 200,
    body: {
      imageUrl:
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfAAf/2Q==",
      compressed: true,
    },
  }).as("generateAvatar");

  // Also add a broader intercept to catch any image endpoints if the exact route changes
  cy.intercept("POST", "**/api/image/**", {
    statusCode: 200,
    body: {
      imageUrl:
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCfAAf/2Q==",
      compressed: true,
    },
  }).as("generateAvatar");

  // Fallback for any other POST requests
  cy.intercept("POST", "**/api/**", {
    statusCode: 200,
    body: { success: true },
  });
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
