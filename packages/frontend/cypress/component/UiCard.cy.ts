import UiCard from '../../src/components/ui/UiCard.vue';

describe('UiCard Component', () => {
  it('should render with default styling', () => {
    cy.mount(UiCard, { slots: { default: 'Card content' } });

    cy.contains('Card content')
      .should('be.visible');
  });

  it('should render slot content', () => {
    cy.mount(UiCard, { slots: { default: '<div>Test content <strong>with HTML</strong></div>' } });

    cy.contains('Test content')
      .should('be.visible');
    cy.get('strong')
      .should('contain', 'with HTML');
  });

  it('should have correct styling classes', () => {
    cy.mount(UiCard, { slots: { default: 'Content' } });

    cy.contains('Content')
      .should('have.class', 'bg-slate-900/60')
      .and('have.class', 'backdrop-blur-sm')
      .and('have.class', 'rounded-lg')
      .and('have.class', 'p-4')
      .and('have.class', 'shadow-lg')
      .and('have.class', 'border')
      .and('have.class', 'border-slate-800/50');
  });

  it('should render multiple child elements', () => {
    cy.mount(UiCard, {
      slots: {
        default: `
          <h1>Title</h1>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        `,
      },
    });

    cy.contains('Title')
      .should('be.visible');
    cy.contains('Paragraph 1')
      .should('be.visible');
    cy.contains('Paragraph 2')
      .should('be.visible');
  });

  it('should render nested components', () => {
    cy.mount(UiCard, { slots: { default: '<button>Click me</button>' } });

    cy.get('button')
      .should('contain', 'Click me')
      .and('be.visible');
  });
});
