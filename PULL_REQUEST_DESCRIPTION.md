## Summary

Removes dead routes, unused components, orphaned features, stale test scripts, and duplicate files from the codebase. This reduces codebase noise, improves build performance, and lowers maintenance burden.

**~1,882 lines of dead code removed across 19 files.**

---

## Changes

### ❌ Dead Page Routes Deleted (5)
| File | Route | Reason |
|------|-------|--------|
| `src/pages/monitoring.tsx` | `/monitoring` | Not linked from sidebar/navbar anywhere |
| `src/pages/audit.tsx` | `/audit` | Not linked from sidebar/navbar anywhere |
| `src/pages/schema-demo.tsx` | `/schema-demo` | Dev-only demo page, no route to it |
| `src/pages/test-500.tsx` | `/test-500` | Test-only page, intentionally throws error |
| `src/pages/governance/index.tsx` | `/governance` | Duplicate of `src/pages/governance.tsx` (Next.js prioritizes `.tsx` over `index.tsx` in same dir — both resolved to same route, creating confusion) |

### ❌ Unused Components Deleted (4)
| File | Reason |
|------|--------|
| `src/components/RoleAwareNav.tsx` | Zero imports across the codebase |
| `src/components/ErrorFallback.tsx` | Zero imports; `ErrorBoundary.tsx` uses inline fallback |
| `src/components/FallbackStates.tsx` | Zero imports |
| `src/components/RecoveryUI.tsx` | Zero imports |

### ❌ Orphaned Features Deleted (2 directories, 3 files)
| File | Reason |
|------|--------|
| `src/features/monitoring/ProtocolHealthDashboard.tsx` | Only consumed by deleted `/monitoring` page |
| `src/features/recovery/index.ts` | Not imported anywhere |
| `src/features/recovery/workflows.ts` | Not imported anywhere |

### ❌ Stale Root Test Scripts Deleted (3)
| File | Reason |
|------|--------|
| `test-navigation.js` | Browser console validation script, not part of test suite |
| `test-validation.js` | Browser console validation script, not part of test suite |
| `verify-sidebar.js` | Browser console validation script, not part of test suite |

### ❌ Orphaned Test Deleted (1)
| File | Reason |
|------|--------|
| `tests/components/ProtocolHealthDashboard.test.tsx` | Test for deleted `ProtocolHealthDashboard` component |

### ✅ Configuration Updates (2 files)
| File | Change |
|------|--------|
| `src/permissions/routes.ts` | Removed `/monitoring` route access config |
| `src/navigation/stateMachine.ts` | Removed `monitoring` from `FeatureKey` type and `DEFAULT_FEATURE_GATES` |

### ✅ Test Update (1 file)
| File | Change |
|------|--------|
| `tests/navigation/stateMachine.test.ts` | Updated feature gate assertion to match new gates |

---

## Active Routes Preserved

All active routes remain untouched and fully functional:

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing/Home | ✅ Active |
| `/dashboard` | Vault Dashboard | ✅ Active |
| `/analytics` | Portfolio Analytics | ✅ Active |
| `/governance` | Governance | ✅ Active |
| `/profile` | Profile Settings | ✅ Active |
| `/diagnostics` | Session Replay | ✅ Active (env-gated) |
| `/404` | Custom 404 | ✅ Active |
| `/500` | Custom 500 | ✅ Active |

---

## Verification

- ✅ No unrelated redesign introduced
- ✅ Dead files confirmed to have zero imports from active code
- ✅ Route config no longer references deleted routes
- ✅ Feature gates consistent with actual routes
- ✅ Navigation state machine test updated

