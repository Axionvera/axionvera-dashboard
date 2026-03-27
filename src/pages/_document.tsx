import { Html, Head, Main, NextScript } from 'next/document';
import { themeBootstrapScript } from '@/utils/themeBootstrap';

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
