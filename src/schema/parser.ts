import type { DashboardPageSchema, DashboardSchemaNode, ParsedDashboardSchema } from "@/types/dashboardSchema";

export class DashboardSchemaError extends Error {
  constructor(message: string, public readonly path: string) {
    super(`${path}: ${message}`);
    this.name = "DashboardSchemaError";
  }
}

const components = ["layout", "form", "table", "widget"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string, path: string): string {
  if (typeof value[key] !== "string" || value[key] === "") {
    throw new DashboardSchemaError(`Expected non-empty string for '${key}'.`, path);
  }
  return value[key];
}

function validateNode(node: unknown, path: string, ids: Set<string>, warnings: string[]): DashboardSchemaNode {
  if (!isRecord(node)) throw new DashboardSchemaError("Expected a component object.", path);
  const id = requireString(node, "id", path);
  if (ids.has(id)) throw new DashboardSchemaError(`Duplicate component id '${id}'.`, path);
  ids.add(id);

  if (!components.includes(node.component as never)) {
    throw new DashboardSchemaError(`Unsupported component '${String(node.component)}'.`, path);
  }

  if (node.component === "layout") {
    if (!Array.isArray(node.children) || node.children.length === 0) {
      throw new DashboardSchemaError("Layout components require at least one child.", path);
    }
    node.children.forEach((child, index) => validateNode(child, `${path}.children[${index}]`, ids, warnings));
  }

  if (node.component === "form") {
    if (!Array.isArray(node.fields) || node.fields.length === 0) {
      throw new DashboardSchemaError("Form components require at least one field.", path);
    }
    node.fields.forEach((field, index) => {
      if (!isRecord(field)) throw new DashboardSchemaError("Expected a field object.", `${path}.fields[${index}]`);
      requireString(field, "id", `${path}.fields[${index}]`);
      requireString(field, "label", `${path}.fields[${index}]`);
    });
  }

  if (node.component === "table") {
    if (!Array.isArray(node.columns) || node.columns.length === 0) {
      throw new DashboardSchemaError("Table components require at least one column.", path);
    }
    if (!Array.isArray(node.rows)) throw new DashboardSchemaError("Table rows must be an array.", path);
  }

  if (node.component === "widget" && (!Array.isArray(node.widgets) || node.widgets.length === 0)) {
    throw new DashboardSchemaError("Widget components require at least one widget.", path);
  }

  if (node.className) warnings.push(`${path}: className is accepted but should only use design-system utility classes.`);
  return node as unknown as DashboardSchemaNode;
}

export function parseDashboardSchema(input: unknown): ParsedDashboardSchema {
  if (!isRecord(input)) throw new DashboardSchemaError("Schema must be an object.", "$schema");
  if (input.version !== 1) throw new DashboardSchemaError("Only dashboard schema version 1 is supported.", "$schema.version");
  requireString(input, "id", "$schema");
  requireString(input, "title", "$schema");
  const warnings: string[] = [];
  validateNode(input.root, "$schema.root", new Set(), warnings);
  return { schema: input as unknown as DashboardPageSchema, warnings };
}
