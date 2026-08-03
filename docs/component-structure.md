# Component Architecture & Subcomponent Guidelines

This document outlines structural patterns and refactoring standards for components in the Axionvera Dashboard repository.

## Component Sizing & Responsibility Thresholds

To maintain code readability, testability, and fast render performance:

1. **Max File Size**: Single component files should aim to remain under **250 lines of code**.
2. **Single Responsibility**: Layout structure, state orchestration, form validation, and complex child UI panels should be decoupled into focused subcomponents.
3. **Subcomponent Organization**: When a component exceeds complexity thresholds, place its subcomponents in a dedicated folder named after the component (e.g. `src/components/navbar/` or `src/components/playback/`).

## Subcomponent Directory Structure Pattern

```text
src/components/
├── Navbar.tsx                   # Main orchestrator component
├── navbar/                      # Dedicated subcomponent folder
│   ├── index.ts                 # Clean re-exports
│   ├── NavLinks.tsx             # Presentational navigation links
│   ├── WalletIcon.tsx           # Inline SVG renderer
│   ├── ConnectedWalletDropdown.tsx  # Wallet menu & actions
│   └── WalletPickerDropdown.tsx # Wallet selection modal
```

## Guidelines for Refactoring Oversized Components

- **Preserve Public API**: Do not alter external props or exports of top-level components when extracting subcomponents.
- **Keep Hooks Decoupled**: Extract pure helper functions and business logic into dedicated utility modules (e.g., `playbackUtils.ts`).
- **Export Subcomponents**: Always include an `index.ts` within the subcomponent directory for structured re-exports.
- **Add Component Unit Tests**: Provide focused unit test coverage in `tests/components/` for both the container and extracted subcomponents.
