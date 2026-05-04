describe('Login Flow', () => {
  it('logs the user in with valid credentials', () => {
    cy.visit('/login.html');
    cy.getByTestId('email').type('test@shopco.de');
    cy.getByTestId('password').type('password123');
    cy.getByTestId('login-submit').click();
    cy.url().should('include', '/products.html');
  });

  it('shows an error for wrong credentials', () => {
    cy.visit('/login.html');
    cy.getByTestId('email').type('test@shopco.de');
    cy.getByTestId('password').type('nope');
    cy.getByTestId('login-submit').click();
    cy.getByTestId('login-error').should('be.visible').and('contain.text', 'INVALID_CREDENTIALS');
  });
});
