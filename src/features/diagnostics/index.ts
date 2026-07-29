/**
 * @module features/diagnostics
 *
 * Public API for the diagnostics and session replay UI.
 * The diagnostic event buffer lives in `@/diagnostics`, replay in `@/session`.
 */

export { ProvenanceViewer } from "./components/ProvenanceViewer";
export { default as SessionReplayPanel } from "./components/SessionReplayPanel";
export {
  default as SessionPlaybackPanel,
  type SessionPlaybackPanelProps,
} from "./components/SessionPlaybackPanel";
