# Help Drawer FAQ Component

## Summary

Implemented a HelpDrawer component that provides users with quick access to frequently asked questions about the Axionvera vault, reducing support inquiries and keeping users on the platform.

## Problem Solved

Users often have questions about how the vault works (e.g., "What is Soroban?", "How are rewards calculated?"). Previously, they had to leave the site to find answers. This feature provides an easily accessible FAQ inside the app.

## Solution Overview

### Files Created

| File | Description |
|------|-------------|
| `src/components/HelpDrawer.tsx` | New component with slide-in drawer, 8 FAQ items, and external docs link |

### Files Modified

| File | Changes |
|------|---------|
| `src/components/Navbar.tsx` | Added import and rendered HelpDrawer component |

## Features

- **Help Icon Button** — Fixed position in bottom-right corner (next to ThemeToggle)
- **Slide-in Drawer** — Animates from right side with smooth 300ms transition
- **8 FAQ Items:**
  1. What is Soroban?
  2. How are rewards calculated?
  3. How do I connect my wallet?
  4. What is the Axionvera Vault?
  5. How do I withdraw my funds?
  6. Is my funds safe?
  7. What tokens can I deposit?
  8. Where can I find full documentation?
- **External Documentation Link** — Links to `https://docs.axionvera.network`
- **Accessible** — Proper ARIA attributes, keyboard navigation support

## Acceptance Criteria

- [x] Created HelpDrawer component
- [x] Added "?" icon to Navbar (fixed position)
- [x] Drawer slides in from the right
- [x] Populated with 5-10 common questions
- [x] Includes link to full external documentation site

## Technical Notes

- Uses React's `useState` for drawer open/close and FAQ expansion
- Implements proper hydration handling to avoid mismatch
- Follows existing component patterns (similar to ThemeToggle)
- Uses existing design tokens for colors and spacing

## Testing Steps

1. **Verify component exists:**
   ```bash
   ls -la src/components/HelpDrawer.tsx
   ```

2. **Verify Navbar integration:**
   ```bash
   grep -n "HelpDrawer" src/components/Navbar.tsx
   ```

3. **Run linter:**
   ```bash
   npm run lint
   ```

4. **Manual testing:**
   - Start dev server: `npm run dev`
   - Open http://localhost:3000
   - Click the **?** icon in bottom-right corner
   - Verify drawer slides in from right
   - Click FAQ questions to expand/collapse
   - Verify "View Full Documentation" link is present
   - Test on /dashboard and /profile pages