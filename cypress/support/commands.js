Cypress.Commands.add('loginAs', (email, password) => {
  cy.request('POST', '/api/auth/login', { email, password }).then((res) => {
    window.localStorage.setItem('shopco.token', res.body.token);
  });
});

Cypress.Commands.add('getByTestId', (id) => {
  return cy.get(`[data-testid="${id}"]`);
});

Cypress.Commands.add('resetCart', () => {
  const token = window.localStorage.getItem('shopco.token');
  if (!token) return;
  cy.request({
    method: 'DELETE',
    url: '/api/orders/cart',
    headers: { authorization: `Bearer ${token}` },
    failOnStatusCode: false
  });
});
