/**
 * Font CSS variable hooks.
 *
 * CI and local preview environments may not have outbound access to Google Fonts.
 * Keep the variables stable for Tailwind/CSS consumers while letting the CSS font
 * stacks fall back to system fonts without a build-time network fetch.
 */
export const inter = {
  variable: 'font-inter',
};

export const jetbrainsMono = {
  variable: 'font-mono',
};
