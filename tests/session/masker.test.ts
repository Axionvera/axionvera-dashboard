import { Masker, DEFAULT_BLOCK_SELECTORS, defaultMasker } from "@/session";

const buildElement = (tag: string, options: { id?: string; classes?: string[]; attrs?: Record<string, string>; text?: string } = {}) => {
  const el = document.createElement(tag);
  if (options.id) el.id = options.id;
  for (const cls of options.classes ?? []) el.classList.add(cls);
  for (const [key, value] of Object.entries(options.attrs ?? {})) el.setAttribute(key, value);
  if (options.text !== undefined) el.textContent = options.text;
  return el;
};

describe("Masker", () => {
  it("uses sensible defaults when no options are provided", () => {
    const masker = new Masker();
    expect(masker["blockSelectors"]).toEqual(DEFAULT_BLOCK_SELECTORS);
    expect(masker["maxDepth"]).toBeGreaterThan(0);
  });

  it("shouldMaskElement returns true for any element matching a block selector", () => {
    const masker = new Masker({ blockSelectors: [".sensitive"] });
    const el = buildElement("div", { classes: ["sensitive"], text: "secret content" });
    document.body.appendChild(el);
    expect(masker.shouldMaskElement(el)).toBe(true);
  });

  it("shouldMaskElement returns true when an ancestor matches", () => {
    const masker = new Masker({ blockSelectors: [".sensitive"] });
    const parent = buildElement("div", { classes: ["sensitive"] });
    const child = buildElement("span", { text: "inner" });
    parent.appendChild(child);
    document.body.appendChild(parent);
    expect(masker.shouldMaskElement(child)).toBe(true);
  });

  it("invalid selectors do not raise", () => {
    const masker = new Masker({ blockSelectors: ["##bogus"] });
    const el = buildElement("div");
    document.body.appendChild(el);
    expect(() => masker.shouldMaskElement(el)).not.toThrow();
  });

  it("shouldMaskElement never throws on detached elements", () => {
    const masker = new Masker();
    const el = document.createElement("span");
    expect(masker.shouldMaskElement(el)).toBe(false);
  });

  it("maskText replaces only non-whitespace characters", () => {
    const masker = new Masker({ replaceWith: "#" });
    expect(masker.maskText("")).toBe("");
    expect(masker.maskText("hello world")).toBe("##### #####");
    expect(masker.maskText("\n\t ")).toBe("\n\t ");
  });

  it("maskInputValue returns raw value for safe fields when sensitive masking disabled", () => {
    const masker = new Masker({ maskSensitiveInputs: false, blockSelectors: [] });
    const input = document.createElement("input");
    input.type = "text";
    input.value = "sensitive user typed this";
    expect(masker.maskInputValue(input, input.value)).toBe("sensitive user typed this");
  });

  it("maskInputValue always masks password values", () => {
    const masker = new Masker({ maskSensitiveInputs: true });
    const input = document.createElement("input");
    input.type = "password";
    expect(masker.maskInputValue(input, "hunter2")).toBe("•••••••");
  });

  it("maskInputValue masks email input values by default", () => {
    const masker = new Masker();
    const input = document.createElement("input");
    input.type = "email";
    expect(masker.maskInputValue(input, "user@example.com")).toBe("••••••••••••••••");
  });

  it("maskInputValue masks tel input values by default", () => {
    const masker = new Masker();
    const input = document.createElement("input");
    input.type = "tel";
    expect(masker.maskInputValue(input, "+1-555-555-5555")).toBe("•••••••••••••••");
  });

  it("maskInputValue masks values inside blocked containers", () => {
    const masker = new Masker({ blockSelectors: [".secret"] });
    const container = buildElement("div", { classes: ["secret"] });
    const input = document.createElement("input");
    input.type = "text";
    input.value = "123-45-6789";
    container.appendChild(input);
    document.body.appendChild(container);
    expect(masker.maskInputValue(input, "123-45-6789")).toBe("•••••••••••");
  });

  it("maskInputValue returns empty string for SELECT elements", () => {
    const masker = new Masker();
    const select = document.createElement("select");
    expect(masker.maskInputValue(select, "AB")).toBe("");
  });

    it("serializeNode redacts masked subtrees and preserves structure", () => {
    const masker = new Masker({ blockSelectors: [".secret"], maxDepth: 3 });
    const root = buildElement("div", { text: "public" });
    const secret = buildElement("div", { classes: ["secret"], text: "secret content" });
    root.appendChild(secret);
    document.body.appendChild(root);

    const serialized = masker.serializeNode(root);
    expect(serialized).not.toBeNull();
    expect(serialized!.tag).toBe("div");
    // The root has both a `#text` node ("public") and an element child, so
    // the serialization preserves both. The masked subtree only contributes
    // the secret element, never its descendants.
    expect(serialized!.children).toHaveLength(2);
    const [textNode, secretNode] = serialized!.children;
    expect(textNode.tag).toBe("#text");
    expect(textNode.text).toBe("public");
    expect(secretNode.tag).toBe("div");
    expect(secretNode.masked).toBe(true);
    // maskText preserves whitespace, so "secret content" maps to the same
    // length pattern with bullets instead of non-whitespace characters.
    expect(secretNode.text).toBe("•••••• •••••••");
    expect(secretNode.children).toEqual([]);
  });

  it("serializeNode drops empty/whitespace-only text nodes", () => {
    const masker = new Masker();
    const root = document.createElement("div");
    root.appendChild(document.createTextNode("   "));
    root.appendChild(document.createTextNode("visible"));
    const serialized = masker.serializeNode(root);
    expect(serialized!.children).toHaveLength(1);
    expect(serialized!.children[0].text).toBe("visible");
  });

  it("serializeNode drops src and href attributes that can leak secrets", () => {
    const masker = new Masker();
    const link = document.createElement("a");
    link.setAttribute("href", "https://example.com/?token=secret");
    link.textContent = "click me";
    const serialized = masker.serializeNode(link);
    expect(serialized).not.toBeNull();
    expect(serialized!.attrs.href).toBeUndefined();
  });

  it("buildSelector prefers id, data-session-id, name, data-testid", () => {
    const masker = new Masker();
    const byId = buildElement("div", { id: "profile" });
    expect(masker.buildSelector(byId)).toBe("#profile");

    const byData = buildElement("div", { attrs: { "data-session-id": "abc" } });
    expect(masker.buildSelector(byData)).toBe('[data-session-id="abc"]');

    const byName = buildElement("input", { attrs: { name: "email" } });
    expect(masker.buildSelector(byName)).toBe('input[name="email"]');

    const byTestId = buildElement("div", { attrs: { "data-testid": "modal" } });
    expect(masker.buildSelector(byTestId)).toBe('[data-testid="modal"]');
  });

  it("buildSelector falls back to nth-of-type for plain elements", () => {
    const masker = new Masker();
    const parent = document.createElement("div");
    const first = document.createElement("span");
    const second = document.createElement("span");
    parent.appendChild(first);
    parent.appendChild(second);
    expect(masker.buildSelector(first)).toBe("span:nth-of-type(1)");
    expect(masker.buildSelector(second)).toBe("span:nth-of-type(2)");
  });

  it("buildSelector returns the bare tag when the element is the only sibling of its type", () => {
    const masker = new Masker();
    const parent = document.createElement("div");
    const span = document.createElement("span");
    parent.appendChild(document.createElement("em"));
    parent.appendChild(span);
    expect(masker.buildSelector(span)).toBe("span");
  });

  it("defaultMasker is a ready-to-use singleton", () => {
    expect(defaultMasker).toBeInstanceOf(Masker);
  });
});
