/**
 * Metro Configuration — React Native / Expo
 * ------------------------------------------
 * Maps Node.js core modules that are absent in React Native to userland
 * polyfills.  This file is only used when this codebase is consumed as part of
 * a React Native / Expo project.  The Next.js (web) build ignores it entirely.
 *
 * See REACT_NATIVE.md for the full setup guide.
 */

// Use expo/metro-config when inside an Expo project; fall back to the bare
// React Native config otherwise.
let getDefaultConfig;
try {
  ({ getDefaultConfig } = require('expo/metro-config'));
} catch {
  ({ getDefaultConfig } = require('@react-native/metro-config'));
}

const defaultConfig = getDefaultConfig(__dirname);

/** @type {import('metro-config').MetroConfig} */
module.exports = {
  ...defaultConfig,

  resolver: {
    ...defaultConfig.resolver,

    /**
     * Map Node core modules → polyfill packages.
     * When the SDK (or stellar-sdk) does  `require('crypto')` at runtime Metro
     * will resolve it to `react-native-quick-crypto` instead of crashing.
     */
    extraNodeModules: {
      ...defaultConfig.resolver?.extraNodeModules,
      crypto: require.resolve('react-native-quick-crypto'),
      buffer: require.resolve('buffer'),
      stream: require.resolve('readable-stream'),
      // Additional modules that @stellar/stellar-sdk may pull in:
      http: require.resolve('@tradle/react-native-http'),
      https: require.resolve('https-browserify'),
      net: require.resolve('react-native-tcp'),
      os: require.resolve('react-native-os'),
      path: require.resolve('path-browserify'),
      url: require.resolve('url'),
      zlib: require.resolve('browserify-zlib'),
      assert: require.resolve('assert'),
      events: require.resolve('events'),
      querystring: require.resolve('querystring-es3'),
      util: require.resolve('util'),
      vm: require.resolve('vm-browserify'),
    },

    /**
     * Ensure TypeScript source files are resolved by Metro.
     */
    sourceExts: [
      ...new Set([
        ...(defaultConfig.resolver?.sourceExts ?? []),
        'ts',
        'tsx',
        'cjs',
        'mjs',
      ]),
    ],
  },

  transformer: {
    ...defaultConfig.transformer,
    // Required for react-native-quick-crypto's JSI bindings.
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
