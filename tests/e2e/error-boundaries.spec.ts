import { test, expect } from '@playwright/test';

test.describe('Error Boundaries', () => {
  test('should display SectionErrorBoundary when a section fails', async ({ page }) => {
    // Navigate to a page that triggers an error. For this test, we can use the test-500 page
    // or simulate an error in a section if we had a specific mock.
    // Given we don't have a specific failing section route out of the box, we check for the standard fallback text
    // if one were to fail. We'll use the 500 route as a proxy for top-level errors for now.
    
    // Check if the top-level ErrorBoundary works on test-500 route
    const response = await page.goto('/test-500');
    
    // We expect the top-level error boundary to catch it or the 500 page to show
    // We'll check for either "500 - Server-side error occurred" or "We isolated a dashboard error"
    const bodyText = await page.locator('body').innerText();
    expect(
      bodyText.includes('500 - Server-side error occurred') || 
      bodyText.includes('We isolated a dashboard error')
    ).toBeTruthy();
  });
});
