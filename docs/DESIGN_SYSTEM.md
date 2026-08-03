# Axionvera Design System

A set of reusable UI primitives, design tokens, and patterns used across the Axionvera dashboard.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Utilities](#utilities)
3. [Components](#components)
   - [Alert](#alert)
   - [Badge](#badge)
   - [Button](#button)
   - [Card](#card)
   - [Dialog](#dialog)
   - [IconButton](#iconbutton)
   - [Input](#input)
   - [Label](#label)
   - [MetricCard](#metriccard)
   - [Select](#select)
   - [Spinner](#spinner)
   - [Textarea](#textarea)
4. [Usage Patterns](#usage-patterns)
5. [Accessibility](#accessibility)

---

## Design Tokens

Tokens live in `src/tokens.json` and are surfaced as CSS custom properties in `src/styles/theme.css`. Import the tokens via CSS variables — never hard-code hex values in components.

### Categories

| Category    | Prefix             | Example                          |
|-------------|--------------------|----------------------------------|
| Color       | `--color-*`        | `--color-bg-primary`             |
| Typography  | `--typography-*`   | `--typography-size-sm`           |
| Spacing     | `--spacing-*`      | `--spacing-4`                    |
| Border radius | `--radius-*`     | `--radius-xl`                    |
| Shadow      | `--shadow-*`       | `--shadow-md`                    |
| Z-index     | `--z-*`            | `--z-modal`                      |
| Transition  | `--duration-*`     | `--duration-base`                |

### Tailwind mapping

Tailwind is configured to use these CSS variables via the `bg-background-*`, `text-text-*`, `border-border-*`, and `text-axion-*` utility classes defined in `tailwind.config.js`. Use these classes in components rather than the raw CSS variables.

---

## Utilities

### `cn(...classes)` — `src/lib/utils.ts`

Merges class strings, filtering falsy values. Drop-in for `clsx`.

```ts
import { cn } from "@/lib/utils";

cn("base-class", isActive && "active", undefined, "another")
// → "base-class active another"
```

---

## Components

All components are exported from `src/design-system/index.ts`:

```ts
import { Button, Badge, Alert, Spinner, Card, Dialog, Input, Select, Textarea, Label, IconButton, MetricCard } from "@/design-system";
```

---

### Alert

Contextual feedback message with accessible roles.

```tsx
<Alert variant="error" title="Transaction failed">
  Insufficient balance to complete this operation.
</Alert>

<Alert variant="success">Proposal created successfully.</Alert>
```

**Props**

| Prop      | Type                                      | Default     |
|-----------|-------------------------------------------|-------------|
| `variant` | `"info" \| "success" \| "error" \| "warning"` | `"info"` |
| `title`   | `string`                                  | —           |
| `live`    | `"polite" \| "assertive" \| "off"`        | auto        |

`role="alert"` is applied for `error`/`warning`; `role="status"` for `info`/`success`. `aria-live` defaults match the role.

---

### Badge

Compact status label for proposals, transactions, and categories.

```tsx
<Badge variant="active">Active</Badge>
<Badge variant="success">Passed</Badge>
<Badge variant="error">Rejected</Badge>
```

**Variants**

`default` · `success` · `error` · `warning` · `info` · `active` · `passed` · `rejected` · `executed` · `cancelled` · `pending`

---

### Button

Primary interactive control with variant, size, and loading support.

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Confirm Deposit
</Button>

<Button variant="secondary" loading loadingLabel="Submitting…">
  Submit
</Button>

<Button variant="ghost" leftIcon={<PlusIcon />}>
  Add Item
</Button>
```

**Props**

| Prop           | Type                                                      | Default     |
|----------------|-----------------------------------------------------------|-------------|
| `variant`      | `"primary" \| "secondary" \| "ghost" \| "danger" \| "outline"` | `"primary"` |
| `size`         | `"sm" \| "md" \| "lg"`                                   | `"md"`      |
| `loading`      | `boolean`                                                 | `false`     |
| `loadingLabel` | `string`                                                  | `"Loading…"` |
| `leftIcon`     | `ReactNode`                                               | —           |
| `rightIcon`    | `ReactNode`                                               | —           |

Extends all native `<button>` props. `type="button"` is set by default to prevent accidental form submission. Passes `aria-busy` when loading.

---

### Card

Layout container for grouped content sections.

```tsx
<Card as="section" padding="md">
  <CardHeader>
    <CardTitle>Vault Balance</CardTitle>
    <CardDescription>Your deposited assets</CardDescription>
  </CardHeader>
  <CardBody>…</CardBody>
  <CardFooter>…</CardFooter>
</Card>
```

**Props**

| Prop      | Type                                  | Default  |
|-----------|---------------------------------------|----------|
| `as`      | `"div" \| "section" \| "article"`    | `"div"`  |
| `padding` | `"none" \| "sm" \| "md" \| "lg"`    | `"md"`   |

---

### Dialog

Accessible modal dialog with built-in focus trap, Escape handling, and previous focus restore.

```tsx
<Dialog
  open={isOpen}
  onClose={handleClose}
  title="Create Proposal"
  description="Submit a new governance proposal."
  size="md"
>
  <form onSubmit={handleSubmit}>
    {/* form fields */}
    <DialogFooter>
      <Button variant="secondary" onClick={handleClose}>Cancel</Button>
      <Button type="submit" variant="primary">Submit</Button>
    </DialogFooter>
  </form>
</Dialog>
```

**Props**

| Prop          | Type                          | Default  |
|---------------|-------------------------------|----------|
| `open`        | `boolean`                     | required |
| `onClose`     | `() => void`                  | required |
| `title`       | `string`                      | required |
| `description` | `string`                      | —        |
| `size`        | `"sm" \| "md" \| "lg"`       | `"md"`   |

Focus trap cycles through all focusable descendants. Pressing Escape calls `onClose`. Focus returns to the trigger element on close.

---

### IconButton

Square button for icon-only actions. Requires a visible `label` for screen readers.

```tsx
<IconButton label="Close dialog" variant="ghost" size="md" onClick={onClose}>
  <XMarkIcon />
</IconButton>
```

**Props**

| Prop      | Type                                    | Default     |
|-----------|-----------------------------------------|-------------|
| `label`   | `string`                                | required    |
| `variant` | `"default" \| "ghost" \| "danger"`     | `"default"` |
| `size`    | `"sm" \| "md" \| "lg"`                 | `"md"`      |

---

### Input

Text field with optional label, error, and helper text. Auto-generates `id`/`htmlFor` association.

```tsx
<Input
  label="Amount"
  required
  placeholder="0.0"
  error={errors.amount?.message}
  helperText="Enter a value between 0.0001 and 1000"
/>
```

**Props**

| Prop         | Type        | Default |
|--------------|-------------|---------|
| `label`      | `string`    | —       |
| `error`      | `string`    | —       |
| `helperText` | `ReactNode` | —       |

Extends all native `<input>` props. Sets `aria-invalid` and `aria-describedby` automatically. Reserves `1.25rem` below the field to prevent layout shift on error.

---

### Label

Styled `<label>` with optional required indicator.

```tsx
<Label htmlFor="amount" required>Amount</Label>
```

**Props**

| Prop       | Type      | Default |
|------------|-----------|---------|
| `required` | `boolean` | `false` |
| `error`    | `boolean` | `false` |

The asterisk `*` is `aria-hidden`; screen readers hear "(required)" instead.

---

### MetricCard

Reusable dashboard metric card for repeated stats in analytics, governance, and vault summaries. Use this instead of hand-rolling rounded bordered cards that contain a label, value, optional icon, and helper text.

```tsx
<MetricCard
  label="Total Rewards Earned"
  value={formatAmount(totalRewards)}
  icon={<RewardsIcon />}
  description="Average rate: 4%"
/>

<MetricCard label="Active Proposals" value={3} compact />
```

**Props**

| Prop          | Type        | Default |
|---------------|-------------|---------|
| `label`       | `ReactNode` | required |
| `value`       | `ReactNode` | required |
| `icon`        | `ReactNode` | — |
| `description` | `ReactNode` | — |
| `compact`     | `boolean`   | `false` |

Prefer `compact` for dense grids such as governance summary rows. Pass `className` only for contextual layout or background adjustments; keep typography and spacing centralized here.

---

### Select

Styled `<select>` with optional label and error state.

```tsx
<Select
  id="status-filter"
  aria-label="Filter by status"
  value={filter}
  onChange={(e) => setFilter(e.target.value)}
>
  <option value="all">All</option>
  <option value="active">Active</option>
</Select>
```

**Props**

| Prop         | Type     | Default |
|--------------|----------|---------|
| `label`      | `string` | —       |
| `error`      | `string` | —       |
| `helperText` | `string` | —       |

Extends all native `<select>` props.

---

### Spinner

Animated loading indicator with accessible label.

```tsx
<Spinner size="md" label="Loading transactions…" />
```

**Props**

| Prop    | Type                             | Default        |
|---------|----------------------------------|----------------|
| `size`  | `"xs" \| "sm" \| "md" \| "lg"` | `"md"`         |
| `label` | `string`                         | `"Loading…"`   |

Renders as `role="status"` with `aria-label`. The SVG is `aria-hidden`.

---

### Textarea

Multi-line text field with the same label/error API as `Input`.

```tsx
<Textarea
  label="Description"
  required
  rows={5}
  placeholder="Describe your proposal…"
  error={errors.description?.message}
/>
```

Extends all native `<textarea>` props.

---

## Usage Patterns

### Form with validation

```tsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  <Input
    label="Title"
    required
    error={errors.title?.message}
    {...register("title")}
  />
  <Textarea
    label="Description"
    required
    rows={4}
    error={errors.description?.message}
    {...register("description")}
  />
  {submitError && <Alert variant="error">{submitError}</Alert>}
  <Button type="submit" loading={isSubmitting} loadingLabel="Saving…" className="w-full">
    Save
  </Button>
</form>
```

### Status badge in a table

```tsx
<Badge variant={statusToBadgeVariant(tx.status)}>{tx.status}</Badge>
```

### Confirmation dialog

```tsx
<Dialog open={open} onClose={onClose} title="Confirm Withdrawal" size="sm">
  <p className="text-sm text-text-secondary">
    You are about to withdraw {amount} XLM. This cannot be undone.
  </p>
  <DialogFooter>
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="danger" onClick={onConfirm}>Withdraw</Button>
  </DialogFooter>
</Dialog>
```

---

## Accessibility

Every primitive follows WCAG 2.1 Level AA requirements:

- **Focus management** — `Button`, `IconButton`, and `Dialog` use `:focus-visible` rings with sufficient contrast.
- **Labels** — `Input`, `Select`, `Textarea` auto-associate `htmlFor`/`id`. `IconButton` requires a `label` prop.
- **Live regions** — `Alert` sets `aria-live` appropriate to severity. `Spinner` uses `role="status"`.
- **Dialog** — `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, Escape closes, prior focus restored.
- **Required fields** — `Label` announces "(required)" to screen readers while showing `*` visually.
- **Error states** — `Input`/`Select`/`Textarea` set `aria-invalid="true"` and `aria-describedby` pointing to the error message.

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for the full audit and testing checklist.
