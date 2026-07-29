import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { isSessionReplayEnabled } from "@/utils/env";
import { SessionReplayPanel } from "@/features/diagnostics";

/**
 * `/diagnostics` is the entry point to the Session Replay & User Journey
 * Recorder. The whole page is gated behind the `NEXT_PUBLIC_ENABLE_SESSION_REPLAY`
 * env var: when missing or not `"true"`, the server returns `notFound: true`
 * so the route appears genuinely 404 to anyone (even if they guess the URL).
 *
 * Why server-side? The env var is inlined at build time for the client bundle,
 * but the production server also reads `process.env` / `window._env_`. Returning
 * the gate decision from `getServerSideProps` guarantees the SSR HTML and the
 * client render agree, avoiding hydration mismatch warnings.
 */
export const getServerSideProps: GetServerSideProps<{ enabled: true }> = async () => {
  if (!isSessionReplayEnabled()) {
    return { notFound: true };
  }
  return { props: { enabled: true } };
};

export default function DiagnosticsPage(
  _props: InferGetServerSidePropsType<typeof getServerSideProps>,
) {
  // `getServerSideProps` guarantees we only render when the feature is enabled.
  // We default `autoStart` to false so the page doesn't silently begin recording
  // the developer's own session the moment they land here.
  return (
    <>
      <Head>
        <title>Session Replay · Diagnostics · Axionvera</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="Record and replay user journeys for debugging. Visible only when NEXT_PUBLIC_ENABLE_SESSION_REPLAY is enabled."
        />
      </Head>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Session Replay · Diagnostics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record user sessions for debugging. Recordings stay on this device and can be
            inspected, replayed, exported, or deleted from the list below.
          </p>
        </header>
        <SessionReplayPanel autoStart={false} />
      </main>
    </>
  );
}
