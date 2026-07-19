# Quick CI Guide

## ⚡ TL;DR

Before pushing code:
```bash
npm run verify-ci
```

If it passes, your PR will pass CI. ✅

---

## 🎯 What CI Checks

1. **Lint** - Code style (ESLint)
2. **Type Check** - TypeScript validation
3. **Unit Tests** - Jest tests
4. **E2E Tests** - Playwright end-to-end
5. **Visual Tests** - Screenshot comparison
6. **Build** - Production build

All must pass to merge. ⏰ Takes ~15-20 minutes.

---

## 🔧 Quick Fixes

### Lint Errors
```bash
npm run lint
```

### Type Errors
```bash
npm run typecheck
```

### Test Failures
```bash
npm test
```

### Visual Differences
```bash
npm run test:visual:update
git add tests/visual/**/*.png
git commit -m "Update visual baselines"
```

### Build Errors
```bash
cp .env.test .env
npm run build
```

---

## 📚 More Info

- **Full Docs**: [CI_README.md](./CI_README.md)
- **Fixes Applied**: [../CI_FIXES.md](../CI_FIXES.md)
- **Complete Guide**: [../CI_COMPLETE.md](../CI_COMPLETE.md)

---

## 🆘 Still Stuck?

1. Read error messages carefully
2. Check artifacts in Actions tab
3. Ask the team
4. Open an issue

---

**Remember**: `npm run verify-ci` is your friend! 🚀
