# Dashboard Error Handling

The Axionvera Dashboard employs a standardized approach to error handling to ensure robustness, user-friendliness, and security.

## Philosophy

- **Graceful Degradation:** A single component failure should not take down the entire page.
- **Security First:** Sensitive raw error details, including stack traces, should never be exposed to users in production environments.
- **Actionable Recovery:** Users should be given clear options to recover from an error, such as retrying a failed action or resetting the component state.

## Core Components

We use two primary React Error Boundaries to catch and handle runtime exceptions in the component tree.

### 1. `ErrorBoundary` (Page Level)
- **Location:** `src/components/errors/ErrorBoundary.tsx`
- **Usage:** Typically wrapped around the entire application inside `src/pages/_app.tsx`.
- **Behavior:**
  - Catches unhandled errors that propagate to the top level.
  - Presents a full-page fallback UI indicating a dashboard error.
  - In development (`NODE_ENV === 'development'`), it displays a detailed summary, including the error message and component stack trace.
  - In production, it hides the stack trace and raw error string, only presenting a `Diagnostic ID` for support reference.
  - Allows the user to reset the session or retry the failed section.

### 2. `SectionErrorBoundary` (Component / Widget Level)
- **Location:** `src/components/errors/SectionErrorBoundary.tsx`
- **Usage:** Wrapped around critical sections, widgets, or components that might fail independently (e.g., individual dashboard widgets, charts, API-driven tables).
- **Behavior:**
  - Acts as a lighter version of the main `ErrorBoundary`.
  - Replaces only the failing component with an inline fallback UI (e.g., "This section could not be loaded").
  - Prevents the rest of the page from crashing.
  - Includes a "Try again" button for simple recovery.

## Example Usage

### Wrapping a Dashboard Widget

```tsx
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";

function DashboardWidget() {
  return (
    <SectionErrorBoundary sectionName="My Dashboard Widget">
      <MyWidgetContent />
    </SectionErrorBoundary>
  );
}
```

## Best Practices

1. **Use `SectionErrorBoundary` Strategically:** Do not wrap every single element in an error boundary. Wrap logical blocks or widgets that fetch their own data or have complex state.
2. **Never Expose Sensitive Information:** Ensure any custom error boundaries you write conditionally check `process.env.NODE_ENV === 'development'` before printing or rendering stack traces.
3. **Provide Useful Section Names:** When using `SectionErrorBoundary`, always pass a descriptive `sectionName` prop so the user knows exactly what failed.
