describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the connect wallet prompt on the landing page', () => {
    // Verifies the initial unauthenticated state
    cy.get('body').should('contain.text', 'Connect');
  });

  it('should handle failed login/connect attempts gracefully', () => {
    // Simulate a missing Freighter extension to trigger a failure UI
    cy.window().then((win) => {
      // @ts-ignore - Mocking missing extension
      win.freighter = undefined;
    });

    // Attempt to connect
    cy.contains(/connect/i).click();

    // The UI should display an error or prompt the user to install Freighter
    cy.get('body').should('satisfy', ($body) => {
      const text = $body.text().toLowerCase();
      return text.includes('error') || text.includes('install');
    });
  });

  // Note: Testing a fully successful Freighter Web3 injection in automated CI
  // typically requires custom Cypress plugins like @synthetixio/synpress.
  // We are validating the UI pathways here as a baseline.
});