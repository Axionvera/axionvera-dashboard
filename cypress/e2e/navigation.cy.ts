describe('Dashboard Navigation', () => {
  // We visit the dashboard directly. If the app redirects unauthenticated users,
  // this test ensures the routing architecture functions securely.

  it('should successfully navigate between Dashboard and Profile via Sidebar', () => {
    cy.visit('/dashboard');

    // Find and click the Profile link in the sidebar/nav
    cy.get('nav').contains(/profile/i).click();

    // Verify the URL changed
    cy.url().should('include', '/profile');

    // Verify Profile-specific components render (from README)
    cy.get('body').should('contain.text', 'Security');

    // Navigate back to Dashboard
    cy.get('nav').contains(/dashboard/i).click();
    cy.url().should('include', '/dashboard');

    // Verify Dashboard-specific components render (from README)
    cy.get('body').should('contain.text', 'Balance');
  });
});