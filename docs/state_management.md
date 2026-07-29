# State Management Conventions

This document outlines the state management patterns used in the Axionvera dashboard to ensure clear state ownership and avoid unnecessary duplication.

## Architecture

We use a combination of React Context and custom hooks to manage shared global state:

1. **Context Providers (`src/contexts/`)**
   - Own and maintain the canonical global state.
   - Handle complex logic, API interactions, and event subscriptions.
   - Example: `VaultContext.tsx`, `GovernanceContext.tsx`, `WalletContext.tsx`.

2. **Custom Hooks (`src/hooks/`)**
   - Act as the primary API surface for React components.
   - For global state, these hooks should simply re-export the context logic rather than re-implementing state locally.
   - Example: `useVault.ts` re-exports `useVault`, `useVaultContext`, and `VaultProvider` from `VaultContext.tsx`.

## Avoiding Duplication

**Do not** duplicate state management logic between hooks and contexts. 

*Incorrect Pattern (Duplication):*
- `src/contexts/FeatureContext.tsx` maintains state `X`.
- `src/hooks/useFeature.ts` maintains an independent copy of state `X`.

*Correct Pattern (Delegation):*
- `src/contexts/FeatureContext.tsx` maintains state `X` and exports `useFeatureContext`.
- `src/hooks/useFeature.ts` re-exports `useFeatureContext` as `useFeature`.

## Component Imports

Components should import hooks from the `src/hooks/` directory, not the `src/contexts/` directory. This keeps the import paths stable even if the underlying implementation changes.

```tsx
// Incorrect
import { useVaultContext } from '@/contexts/VaultContext';

// Correct
import { useVault } from '@/hooks/useVault';
```

## Local State

For transient UI state that is not shared across the application, standard React local state (`useState`, `useReducer`) is preferred.
