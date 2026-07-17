import type { MaskOptions, SerializedNode } from "./types";
import {
  DEFAULT_MAX_DEPTH,
  DEFAULT_REPLACE_WITH,
} from "./types";

/**
 * Default CSS selectors whose content is fully blocked from capture.
 * Consumers can override via `MaskOptions.blockSelectors`.
 */
export const DEFAULT_BLOCK_SELECTORS = [
  "[data-session-mask]",
  "[data-private='true']",
  "[data-private='1']",
  ".session-mask",
  // Sensitive input types are blocked unconditionally so they remain
  // masked even if a consumer disables `maskSensitiveInputs` while leaving
  // `blockSelectors` empty.
  "input[type='password']",
  "input[type='email']",
  "input[type='tel']",
];

/**
 * Input types whose value is always treated as sensitive, regardless of any
 * user-applied class or attribute. Mirrors the defaults documented in
 * `docs/SESSION_REPLAY.md`.
 */
const SENSITIVE_INPUT_TYPES = new Set([
  "password",
  "email",
  "tel",
  "credit-card",
  "ssn",
]);

/**
 * `Masker` holds the privacy rules used by the recorder and the JSON exporter.
 *
 * It is deliberately implemented as a plain class with no constructor side
 * effects so the same instance can be shared across the recorder, the
 * exporter, and the player without spinning up any global state.
 */
export class Masker {
  private readonly blockSelectors: string[];
  private readonly maskSensitiveInputs: boolean;
  private readonly replaceWith: string;
  private readonly maxDepth: number;

  constructor(options: MaskOptions = {}) {
    this.blockSelectors = [
      ...DEFAULT_BLOCK_SELECTORS,
      ...(options.blockSelectors ?? []),
    ];
    this.maskSensitiveInputs = options.maskSensitiveInputs ?? true;
    this.replaceWith = options.replaceWith ?? DEFAULT_REPLACE_WITH;
    this.maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  }

  /**
   * Returns `true` when the element (or one of its ancestors) matched any of
   * the configured selectors. Invalid selectors are ignored so a typo in user
   * configuration never bricks the recorder.
   */
  shouldMaskElement(element: Element | null): boolean {
    if (!element || this.blockSelectors.length === 0) return false;
    for (const selector of this.blockSelectors) {
      try {
        if (element.matches(selector)) return true;
      } catch {
        // ignore invalid selectors
      }
    }
    for (const selector of this.blockSelectors) {
      try {
        if (element.closest(selector)) return true;
      } catch {
        // ignore invalid selectors
      }
    }
    return false;
  }

  /**
   * Returns the visible text of `element`, replacing every non-whitespace
   * character with the configured mask character. Whitespace is preserved so
   * layouts stay readable in the replay viewer.
   */
  maskedText(element: Element): string {
    const raw = (element.textContent ?? "").trim();
    if (!raw) return "";
    return raw.replace(/\S/g, this.replaceWith);
  }

  /**
   * Returns the value that should be stored for `element` based on its tag,
   * type, and whether the masker treats it as sensitive.
   */
  maskInputValue(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    raw: string,
  ): string {
    if (!this.maskSensitiveInputs && !this.shouldMaskElement(element)) {
      return raw;
    }
    if (element.tagName.toUpperCase() === "SELECT") {
      // Select values are program-defined (option values), not user-typed.
      // We never persist user-visible selection text here.
      return "";
    }
    const inputType = (element as HTMLInputElement).type?.toLowerCase?.();
    if (inputType && SENSITIVE_INPUT_TYPES.has(inputType)) {
      return this.maskText(raw);
    }
    if (this.shouldMaskElement(element)) {
      return this.maskText(raw);
    }
    return raw;
  }

  maskText(text: string): string {
    if (!text) return text;
    return text.replace(/\S/g, this.replaceWith);
  }

  /**
   * Produce a serializable representation of `node`. The output is safe to
   * store in IndexedDB or a JSON file: it never contains event listeners,
   * stylesheet rules, or script content.
   *
   * Masked subtrees are collapsed to a single masked text node: their
   * children are intentionally omitted so the recorded structure cannot
   * leak PII through titles, alts, or data-* attributes. The element tag,
   * class list, and a boolean `masked: true` flag are preserved so the
   * replay viewer can still display "this region was hidden".
   */
  serializeNode(node: Node, depth = 0): SerializedNode | null {
    if (depth > this.maxDepth) return null;
    if (node.nodeType === 3 /* TEXT_NODE */) {
      const text = node.nodeValue ?? "";
      if (!text.trim()) return null;
      return {
        tag: "#text",
        attrs: {},
        text,
        children: [],
      };
    }
    if (node.nodeType !== 1 /* ELEMENT_NODE */) {
      return null;
    }
    const element = node as Element;
    const masked = this.shouldMaskElement(element);
    const attrs: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      attrs[attr.name] = attr.value;
    }
    // Never persist script content or live href values that could be abused.
    delete attrs.src;
    delete attrs.href;
    if (element instanceof HTMLScriptElement || element instanceof HTMLStyleElement) {
      return null;
    }

    if (masked) {
      // Drop attributes on masked subtrees. Titles, alt text, and data-*
      // attributes on a `.session-mask` element can leak PII even though
      // the element's text is collapsed below. The empty attrs object keeps
      // the serialized shape stable for replay consumers.
      return {
        tag: element.tagName.toLowerCase(),
        attrs: {},
        children: [],
        text: this.maskText(element.textContent ?? ""),
        masked: true,
      };
    }

    const children: SerializedNode[] = [];
    for (const child of Array.from(element.childNodes)) {
      const serialized = this.serializeNode(child, depth + 1);
      if (serialized) children.push(serialized);
    }
    return {
      tag: element.tagName.toLowerCase(),
      attrs,
      children,
    };
  }

  /**
   * Build a stable, best-effort CSS selector for `element`. Falls back to a
   * fragment-style selector (`tag:nth-of-type(...)`) when the element has no
   * id or distinguishing attribute.
   */
  buildSelector(element: Element): string {
    if (element.id) return `#${CSS.escape(element.id)}`;
    const dataset = (element as HTMLElement).dataset;
    if (dataset?.sessionId) {
      return `[data-session-id="${dataset.sessionId}"]`;
    }
    if (typeof element.getAttribute === "function") {
      const name = element.getAttribute("name");
      if (name) return `${element.tagName.toLowerCase()}[name="${name}"]`;
      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${testId}"]`;
    }
    const tag = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (!parent) return tag;
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === element.tagName,
    );
    if (siblings.length === 1) return tag;
    const index = siblings.indexOf(element) + 1;
    return `${tag}:nth-of-type(${index})`;
  }
}

export const defaultMasker = new Masker();
