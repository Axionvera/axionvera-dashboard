/**
 * Structural regression checks for the dashboard folder layout.
 *
 * These are fitness functions, not behaviour tests: they fail when a change
 * re-introduces one of the structural problems the layout refactor removed.
 * The rules they encode are documented in `docs/structure.md`.
 */

import fs from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const COMPONENTS_DIR = path.join(SRC, "components");
const FEATURES_DIR = path.join(SRC, "features");
const PAGES_DIR = path.join(SRC, "pages");

/**
 * The only folders allowed directly under `src/components/`. Every entry here
 * is shared UI: adding a business domain to this list is the regression these
 * checks exist to catch.
 */
const SHARED_COMPONENT_CATEGORIES = [
  "errors",
  "guards",
  "layout",
  "optimized",
  "schema",
  "ui",
  "visualizations",
];

/**
 * Composition roots may wire features together; the rest of `src/components/`
 * must stay feature-agnostic so it can be reused from any page.
 */
const COMPOSITION_ROOTS = ["layout", "optimized"];

const SOURCE_EXTENSIONS = [".ts", ".tsx"];

function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    if (!SOURCE_EXTENSIONS.includes(path.extname(entry.name))) return [];
    if (/\.(test|spec)\.tsx?$/.test(entry.name)) return [];
    return [full];
  });
}

function listDirectories(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** Every module specifier referenced by a file, static or dynamic. */
function importSpecifiers(file: string): string[] {
  const contents = fs.readFileSync(file, "utf8");
  const pattern = /(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g;
  const found: string[] = [];

  for (const match of contents.matchAll(pattern)) {
    found.push(match[1]);
  }

  return found;
}

function toPosix(file: string): string {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

describe("shared component boundary", () => {
  it("only allows shared categories directly under src/components", () => {
    const unexpected = listDirectories(COMPONENTS_DIR).filter(
      (name) => !SHARED_COMPONENT_CATEGORIES.includes(name)
    );

    expect(unexpected).toEqual([]);
  });

  it("keeps no loose files at the root of src/components", () => {
    const looseFiles = fs
      .readdirSync(COMPONENTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    expect(looseFiles).toEqual([]);
  });

  it("does not let shared components depend on a feature", () => {
    const offenders = listSourceFiles(COMPONENTS_DIR)
      .filter((file) => {
        const category = path.relative(COMPONENTS_DIR, file).split(path.sep)[0];
        return !COMPOSITION_ROOTS.includes(category);
      })
      .filter((file) =>
        importSpecifiers(file).some((specifier) => specifier.startsWith("@/features/"))
      )
      .map(toPosix);

    expect(offenders).toEqual([]);
  });
});

describe("feature module boundary", () => {
  const features = listDirectories(FEATURES_DIR);

  it("finds the feature folders", () => {
    expect(features.length).toBeGreaterThan(0);
  });

  it.each(features)("exposes %s through an index barrel", (feature) => {
    expect(fs.existsSync(path.join(FEATURES_DIR, feature, "index.ts"))).toBe(true);
  });

  it("keeps feature components under a components/ subfolder", () => {
    const misplaced = features.flatMap((feature) =>
      fs
        .readdirSync(path.join(FEATURES_DIR, feature), { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
        .map((entry) => `src/features/${feature}/${entry.name}`)
    );

    expect(misplaced).toEqual([]);
  });

  it("is only reached from outside through its barrel", () => {
    const offenders: string[] = [];

    for (const file of listSourceFiles(SRC)) {
      const owningFeature = path
        .relative(FEATURES_DIR, file)
        .split(path.sep)[0];

      for (const specifier of importSpecifiers(file)) {
        const match = /^@\/features\/([^/]+)\//.exec(specifier);
        if (!match) continue;
        if (match[1] === owningFeature) continue;
        offenders.push(`${toPosix(file)} -> ${specifier}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("page routing", () => {
  it("maps every page file to a distinct route", () => {
    const routesByFile = new Map<string, string>();

    for (const file of listSourceFiles(PAGES_DIR)) {
      const name = path.basename(file, path.extname(file));
      if (name.startsWith("_")) continue;

      const relative = path
        .relative(PAGES_DIR, file)
        .replace(/\.tsx?$/, "")
        .split(path.sep)
        .join("/");
      const route = "/" + relative.replace(/(^|\/)index$/, "");

      routesByFile.set(toPosix(file), route === "//" ? "/" : route);
    }

    const collisions = [...routesByFile.entries()]
      .filter(([, route]) =>
        [...routesByFile.values()].filter((other) => other === route).length > 1
      )
      .map(([file, route]) => `${file} -> ${route}`);

    expect(collisions).toEqual([]);
  });
});
