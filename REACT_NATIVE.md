# React Native / Expo Compatibility Guide

This document explains how to use the **Axionvera SDK** inside a React Native
or Expo application.  React Native does not ship Node.js core modules
(`crypto`, `buffer`, `stream`), so the SDK — and its underlying
`stellar-sdk` dependency — must be polyfilled before they can run on iOS or
Android.

---

## Audit Results

The following Node.js runtime dependencies were identified in the SDK:

| Module | Location | Usage |
|--------|----------|-------|
| `crypto` (global) | `src/utils/contractHelpers.ts:64` | `crypto.randomUUID()` to generate transaction IDs |
| `stellar-sdk` internals | `package.json → dependencies` | Pulls in `crypto`, `buffer`, `stream` transitively |

No direct `require("crypto")` / `require("buffer")` / `require("stream")`
calls exist in the dashboard source — all usage goes through the global Web
Crypto API or via `stellar-sdk`.

---

## Required Polyfills

| Node Module | Polyfill Package | Notes |
|-------------|-----------------|-------|
| `crypto` | `react-native-quick-crypto` | JSI-based, fastest option; or use `expo-crypto` for Expo Managed |
| `buffer` | `buffer` | Pure-JS; mirrors Node's `Buffer` exactly |
| `stream` | `readable-stream` | Userland port of Node's stream module |

---

## Step 1 — Install polyfills

### Expo (Managed or Bare)

```bash
npx expo install expo-crypto
npm install buffer readable-stream
```

> If you prefer `react-native-quick-crypto` (faster, JSI-based) instead of
> `expo-crypto`, replace the first command with:
> ```bash
> npm install react-native-quick-crypto
> cd ios && pod install   # bare workflow only
> ```

### Bare React Native

```bash
npm install react-native-quick-crypto buffer readable-stream
cd ios && pod install
```

---

## Step 2 — Register the polyfill entry point

In your app, **replace** any direct SDK import with the polyfill wrapper:

```diff
- import { createAxionveraVaultSdk } from '@/utils/contractHelpers';
+ import { createAxionveraVaultSdk } from '@/sdk/reactNativePolyfill';
```

The file `src/sdk/reactNativePolyfill.ts` sets up all global polyfills before
the SDK code executes, then re-exports every public symbol so nothing else in
your code needs to change.

---

## Step 3 — Configure Metro

`metro.config.js` (already present in the repo root) maps Node core module
names to the polyfill packages at bundle time.

**If you are starting from scratch** or the file doesn't exist yet:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('react-native-quick-crypto'),
  buffer: require.resolve('buffer'),
  stream: require.resolve('readable-stream'),
};

module.exports = config;
```

The file already ships with an extended map covering additional modules that
`stellar-sdk` pulls in transitively (e.g. `http`, `https`, `url`, `zlib`,
`assert`, etc.).

---

## Step 4 — Configure Babel (optional but recommended)

Add `babel-plugin-module-resolver` to remap Node modules at compile time.
This provides a double safety net alongside the Metro resolver.

```bash
npm install --save-dev babel-plugin-module-resolver
```

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],          // or 'module:metro-react-native-babel-preset' for bare RN
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            crypto: 'react-native-quick-crypto',
            buffer: 'buffer',
            stream: 'readable-stream',
          },
        },
      ],
    ],
  };
};
```

---

## Step 5 — TypeScript path aliases (optional)

So that the IDE resolves the same packages as the bundler:

```jsonc
// tsconfig.json — inside "compilerOptions"
{
  "paths": {
    "crypto": ["node_modules/react-native-quick-crypto"],
    "buffer":  ["node_modules/buffer"],
    "stream":  ["node_modules/readable-stream"]
  }
}
```

---

## Step 6 — Verify the integration

1. Start the dev server:

   ```bash
   npx expo start          # Expo
   # or
   npx react-native start  # Bare RN
   ```

2. Open the app on a device or simulator.

3. Navigate to any screen that calls the SDK (e.g. the vault balance screen).

4. Confirm there are **no runtime errors** like:
   - `ReferenceError: crypto is not defined`
   - `Cannot find module 'buffer'`
   - `Stream is not a constructor`

5. Run the unit test suite:

   ```bash
   npm test
   ```

   A test for the polyfill itself lives in
   `src/sdk/__tests__/reactNativePolyfill.test.ts`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `ReferenceError: crypto is not defined` | Polyfill import order | Make sure `reactNativePolyfill.ts` is imported **before** any SDK code. In Expo, add it as the first line of `app/_layout.tsx` (or `App.tsx`). |
| `Cannot find module 'react-native-quick-crypto'` | Package not installed | Run `npm install react-native-quick-crypto` + `pod install` (iOS). |
| iOS build fails after adding `react-native-quick-crypto` | Missing pod | Run `cd ios && pod install`. |
| `Invariant Violation: Module AppRegistry is not a registered callable module` | Metro cache stale | Run `npx expo start --clear` or `npx react-native start --reset-cache`. |
| Bundle size increase | All stellar-sdk deps bundled | Use [Metro bundle splitting](https://metrobundler.dev/) or lazy-load the SDK with `React.lazy`. |

---

## Platform Notes

### Expo Managed Workflow

Use `expo-crypto` instead of `react-native-quick-crypto` (no native code
required, works in Expo Go):

```ts
// src/sdk/reactNativePolyfill.ts — swap the crypto block to:
import * as ExpoCrypto from 'expo-crypto';
if (typeof global.crypto?.randomUUID !== 'function') {
  global.crypto = { randomUUID: () => ExpoCrypto.randomUUID() } as Crypto;
}
```

### Android

No extra steps beyond the install and Metro config above.

### iOS

After installing `react-native-quick-crypto` you **must** run:

```bash
cd ios && pod install
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-26 | Initial React Native compatibility layer added (`src/sdk/reactNativePolyfill.ts`, `metro.config.js`, this guide) |
