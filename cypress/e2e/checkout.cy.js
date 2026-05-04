describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/payment.provider.io/charge', { fixture: 'payment-success.json' }).as('payment');
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
    cy.contains('Bestellung erfolgreich').should('be.visible');
  });

  it('shows error on declined payment', () => {
    cy.intercept('POST', '**/payment.provider.io/charge', {
      statusCode: 402,
      body: { status: 'declined' }
    }).as('payment');
    cy.visit('/products.html');
    cy.getByTestId('product-item').first().find('[data-testid="add-to-cart"]').click();
    cy.visit('/checkout.html');
    cy.getByTestId('card-number').type('4000000000000002');
    cy.getByTestId('card-expiry').type('12/30');
    cy.getByTestId('card-cvc').type('123');
    cy.getByTestId('submit-order').click();
    cy.getByTestId('checkout-error').should('be.visible').and('contain.text', 'PAYMENT_DECLINED');
    cy.url().should('include', '/checkout');
  });
});
