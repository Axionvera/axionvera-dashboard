import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { themeBootstrapScript } from '@/utils/themeBootstrap';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        {/* PWA manifest and theme */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />

        {/* iOS Web App configuration */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AxionVera" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://axionvera.com/" />
        <meta property="og:title" content="AxionVera - DeFi on Stellar" />
        <meta property="og:description" content="Web interface for interacting with Axionvera smart contracts on Stellar (Soroban). Deposit, withdraw, and earn yields." />
        <meta property="og:image" content="https://axionvera.com/og-image.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://axionvera.com/" />
        <meta name="twitter:title" content="AxionVera - DeFi on Stellar" />
        <meta name="twitter:description" content="Web interface for interacting with Axionvera smart contracts on Stellar (Soroban). Deposit, withdraw, and earn yields." />
        <meta name="twitter:image" content="https://axionvera.com/og-image.png" />

        {/* For critical theme initialization that must run before React mounts */}
        <Script
          id="theme-bootstrap-critical"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        {/* For environment config that can load slightly later */}
        <Script src="/env-config.js" strategy="afterInteractive" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}