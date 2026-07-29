## Summary

<!-- What does this PR change, and why? -->

Closes #

## Type of change

- [ ] `feat/` — new feature or enhancement
- [ ] `fix/` — bug fix
- [ ] `docs/` — documentation
- [ ] `refactor/` — restructuring, no logic change
- [ ] `chore/` — maintenance or dependencies

## Quality gates

See [CONTRIBUTING.md](../CONTRIBUTING.md).

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes

## Cleanup checklist

Confirm against [`docs/dashboard-cleanup-checklist.md`](../docs/dashboard-cleanup-checklist.md).

- [ ] **Structure** — no new top-level `src/` folder (there are already 54); no folder whose
      name is a near-synonym of an existing one; the logic/UI split is respected for twin
      folders (`src/<domain>/` vs `src/components/<domain>/`).
- [ ] **Reuse** — I grepped for the component/type name before creating it. New UI has one
      home (`components/` *or* `features/`, not both) and is exported through its `index.ts` barrel.
- [ ] **API** — no raw `fetch()` in components, pages, or contexts. Requests go through
      `src/utils/apiResilience.ts` and read endpoints from `networkConfig.ts`. I did not
      import the orphaned `apiClient.ts` / `enhancedApiClient.ts`.
- [ ] **State** — I used `src/store/` or `src/contexts/` per the lifetime rule, exposed it
      through a hook, added no state library, and reused the existing domain type rather
      than defining a parallel one.
- [ ] **Tests** — new tests live in `tests/` mirroring the `src/` path (or extend an existing
      co-located suite). No test was deleted to make CI pass.
- [ ] **Docs** — new documentation goes in `docs/`, not the repo root. If I added or moved a
      folder, I updated the README structure table.

## Notes for reviewers

<!-- Anything that needs context: trade-offs, follow-ups, known duplication touched. -->
