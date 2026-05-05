describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/email.provider.io/send', { statusCode: 200, body: { ok: true } });
    cy.loginAs('test@shopco.de', 'password123');
    cy.resetCart();
  });

  it('completes purchase and shows order confirmation', () => {
    cy.visit('/products.html');
    cy.getByTestId('product-item').first().find('[data-testid="add-to-cart"]').click();
    cy.url().should('include', '/cart.html');
    cy.visit('/checkout.html');
    cy.getByTestId('card-number').type('4111111111111111');
    cy.getByTestId('card-expiry').type('12/30');
    cy.getByTestId('card-cvc').type('123');
    cy.getByTestId('submit-order').click();
    cy.url().should('include', '/order-confirmation');
  });

  it.skip('shows error on declined payment (skipped: requires runtime mock switch)', () => {
    // Skipped: With PAYMENT_MOCK=true the backend always returns approved.
    // Testing declined payments would require either a configurable mock server
    // or a different test environment.
  });
});
