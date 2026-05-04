describe('Product search', () => {
  it('lists products from the API', () => {
    cy.visit('/products.html');
    cy.getByTestId('product-list').find('[data-testid="product-item"]').its('length').should('be.gte', 1);
  });

  it('filters products by search query', () => {
    cy.visit('/products.html');
    cy.getByTestId('search-input').type('Produkt A');
    cy.getByTestId('search-submit').click();
    cy.getByTestId('product-item').should('contain.text', 'Produkt A');
  });
});
