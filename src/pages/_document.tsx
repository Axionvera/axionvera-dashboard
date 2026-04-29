import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';
import { themeBootstrapScript } from '@/utils/themeBootstrap';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
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