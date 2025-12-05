import UiButton from '../../src/components/ui/UiButton.vue';

describe('UiButton Component', () => {
  it('should render with default variant (primary)', () => {
    cy.mount(UiButton, { slots: { default: 'Click me' } });

    cy.contains('Click me')
      .should('be.visible');
    cy.get('button')
      .should('have.class', 'bg-gradient-to-r')
      .and('have.class', 'from-purple-500')
      .and('have.class', 'to-pink-500');
  });

  it('should render with ghost variant', () => {
    cy.mount(UiButton, {
      props: { variant: 'ghost' },
      slots: { default: 'Ghost Button' },
    });

    cy.contains('Ghost Button')
      .should('be.visible');
    cy.get('button')
      .should('have.class', 'bg-white/10')
      .and('have.class', 'text-white');
  });

  it('should be clickable', () => {
    const onClickSpy = cy.spy()
      .as('onClickSpy');

    cy.mount(UiButton, {
      props: { onClick: onClickSpy },
      slots: { default: 'Click me' },
    });

    cy.contains('Click me')
      .click();
    cy.get('@onClickSpy')
      .should('have.been.calledOnce');
  });

  it('should render with custom classes', () => {
    cy.mount(UiButton, { slots: { default: 'Styled Button' } });

    cy.get('button')
      .should('have.class', 'inline-flex')
      .and('have.class', 'items-center')
      .and('have.class', 'px-3')
      .and('have.class', 'py-1')
      .and('have.class', 'rounded-md')
      .and('have.class', 'font-semibold')
      .and('have.class', 'shadow-sm');
  });
});
