/**
 * Read-only, integrated API reference for OpenAPI 3.x and Swagger 2.0 documents
 * (JSON or YAML).
 *
 * The spec is turned into the same kind of HTML string the Markdown parser
 * produces — every spec value is escaped, descriptions go through the Markdown
 * renderer — so it travels the normal sanitize → link rewrite → components
 * pipeline. Nothing here can issue requests: there is no "try it out", only
 * documentation.
 *
 * To stay fast on large specs, only operation summaries are rendered up front.
 * Each operation/schema body (schema trees, generated examples) is produced
 * lazily the first time it is opened.
 */
import { escapeAttr, escapeHtml as esc } from "./sanitize.js";
import { highlight } from "./highlight.js";
import { renderMarkdown, slugify } from "./markdown.js";
import { parseYaml } from "./yaml.js";
import type { UIStrings } from "./i18n.js";
import type { RenderedDoc, TocEntry } from "./types.js";

// Specs are arbitrary JSON: a loose type keeps the traversal code readable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type J = any;

export class ApiSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiSpecError";
  }
}

const METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
const MAX_DEPTH = 8;
const NODE_BUDGET = 500;
const MAX_EXAMPLE_CHARS = 20_000;
/** Above this many operations, the TOC lists only groups. */
const TOC_OPERATION_LIMIT = 60;

const isObj = (v: unknown): v is Record<string, J> => typeof v === "object" && v !== null && !Array.isArray(v);
const entries = (v: unknown): [string, J][] => (isObj(v) ? Object.entries(v) : []);

/** Parse a JSON or YAML OpenAPI 3.x / Swagger 2.0 document. */
export function parseApiSpec(text: string): J {
  const src = text.replace(/^﻿/, "").trim();
  let doc: J;
  try {
    doc = /^[{[]/.test(src) ? JSON.parse(src) : parseYaml(src);
  } catch (err) {
    throw new ApiSpecError(`the API description could not be parsed: ${(err as Error).message}`);
  }
  const v3 = isObj(doc) && typeof doc.openapi === "string" && /^3\./.test(doc.openapi);
  const v2 = isObj(doc) && String(doc.swagger) === "2.0";
  if (!v3 && !v2) throw new ApiSpecError("not an OpenAPI 3.x or Swagger 2.0 document");
  return doc;
}

export interface ApiRender {
  doc: RenderedDoc;
  /** Lazily rendered bodies keyed by the id of their `<details>`. */
  bodies: Map<string, () => string>;
  /** Lower-cased filter text keyed by the id of each operation/schema. */
  search: Map<string, string>;
}

interface Operation {
  id: string;
  method: string;
  path: string;
  op: J;
  params: J[];
  body?: J;
  responses: [string, J][];
  security?: J[];
}

interface TreeCtx {
  depth: number;
  seen: Set<object>;
  budget: { n: number };
  mode: "req" | "res" | "any";
}

/** Render a parsed spec into an HTML document, a TOC and searchable text. */
export function renderApi(spec: J, s: UIStrings): ApiRender {
  return new ApiRenderer(spec, s).render();
}

class ApiRenderer {
  private readonly v2: boolean;
  private readonly used = new Set<string>();
  private readonly refIds = new Map<object, string>();
  private readonly bodies = new Map<string, () => string>();
  private readonly search = new Map<string, string>();
  private readonly toc: TocEntry[] = [];
  private readonly text: string[] = [];

  constructor(private readonly root: J, private readonly s: UIStrings) {
    this.v2 = String(root.swagger) === "2.0";
  }

  render(): ApiRender {
    const root = this.root, s = this.s, info = isObj(root.info) ? root.info : {};
    const schemas = this.v2 ? root.definitions : root.components?.schemas;
    // Schema anchors are assigned first so every type label can link to them.
    for (const [name, schema] of entries(schemas)) {
      if (isObj(schema)) this.refIds.set(this.deref(schema).node, this.slug("schema-" + name));
    }

    const out: string[] = [];
    const title = String(info.title || s.apiReference);
    const titleId = this.slug(title);
    out.push(`<h1 id="${escapeAttr(titleId)}">${this.anchor(titleId)}${esc(title)}</h1>`);
    const chips = [info.version ? `v${info.version}` : "", this.v2 ? "Swagger 2.0" : `OpenAPI ${root.openapi}`].filter(Boolean);
    out.push(`<p class="nd-api-meta">${chips.map((c) => `<span class="nd-api-chip">${esc(String(c))}</span>`).join("")}</p>`);
    if (info.description) {
      const intro = renderMarkdown(String(info.description), { usedIds: this.used });
      out.push(intro.html);
      for (const h of intro.toc) if (h.level <= 3) this.toc.push(h);
      this.text.push(intro.text);
    }
    this.text.push(title);
    out.push(this.links(info), this.servers());
    out.push(this.auth());
    out.push(`<div class="nd-api-toolbar"></div>`);

    const ops = this.operations();
    const groups = this.groups(ops);
    const listOps = ops.length <= TOC_OPERATION_LIMIT;
    for (const [name, group] of groups) {
      const id = this.slug("tag-" + name);
      const tag = (Array.isArray(root.tags) ? root.tags : []).find((t: J) => t?.name === name) ?? {};
      const label = String(tag["x-displayName"] || name);
      this.toc.push({ id, text: label, level: 2 });
      this.text.push(label);
      let html = `<div class="nd-api-tag"><h2 id="${escapeAttr(id)}">${this.anchor(id)}${esc(label)}</h2>`;
      if (tag.description) html += this.md(tag.description);
      html += `<div class="nd-api-ops">`;
      for (const op of group) {
        html += this.operation(op);
        if (listOps) this.toc.push({ id: op.id, text: op.op.summary ? String(op.op.summary) : `${op.method.toUpperCase()} ${op.path}`, level: 3 });
      }
      out.push(html + `</div></div>`);
    }

    if (isObj(schemas) && Object.keys(schemas).length) {
      const id = this.slug("schemas");
      this.toc.push({ id, text: s.apiSchemas, level: 2 });
      let html = `<div class="nd-api-tag nd-api-models"><h2 id="${escapeAttr(id)}">${this.anchor(id)}${esc(s.apiSchemas)}</h2>`;
      for (const [name, schema] of entries(schemas)) {
        const node = this.deref(schema).node;
        const sid = this.refIds.get(node);
        if (!sid) continue;
        html += `<details class="nd-api-model" id="${escapeAttr(sid)}"><summary><code class="nd-api-name">${esc(name)}</code><span class="nd-api-type">${this.type(schema, 0, false)}</span></summary><div class="nd-api-body"></div></details>`;
        this.bodies.set(sid, () => (node.description ? this.md(node.description) : "") + this.facts(node) + this.tree(schema, "any"));
        this.search.set(sid, `${name} ${node.title ?? ""}`.toLowerCase());
        this.text.push(name);
      }
      out.push(html + `</div>`);
    }

    return { doc: { html: out.join("\n"), toc: this.toc, text: this.text.join(" ") }, bodies: this.bodies, search: this.search };
  }

  // ── Document-level sections ─────────────────────────────────────────────

  private links(info: J): string {
    const items: string[] = [];
    const link = (href: unknown, label: unknown): void => {
      if (typeof href === "string" && href) items.push(`<a href="${escapeAttr(href)}">${esc(String(label || href))}</a>`);
    };
    const docs = this.root.externalDocs;
    if (isObj(docs)) link(docs.url, docs.description);
    if (isObj(info.contact)) {
      link(info.contact.url, info.contact.name);
      if (typeof info.contact.email === "string") link("mailto:" + info.contact.email, info.contact.email);
    }
    if (isObj(info.license)) link(info.license.url, info.license.name);
    link(info.termsOfService, "Terms of service");
    return items.length ? `<p class="nd-api-links">${items.join("")}</p>` : "";
  }

  private servers(): string {
    const root = this.root;
    let list: J[] = Array.isArray(root.servers) ? root.servers : [];
    if (this.v2 && root.host) {
      const schemes: string[] = Array.isArray(root.schemes) && root.schemes.length ? root.schemes : ["https"];
      list = schemes.map((scheme) => ({ url: `${scheme}://${root.host}${root.basePath ?? ""}` }));
    }
    const items = list.filter((server) => isObj(server) && server.url).map((server) =>
      `<li><code>${esc(String(server.url))}</code>${server.description ? ` <span class="nd-api-muted">${esc(String(server.description))}</span>` : ""}</li>`);
    return items.length ? `<div class="nd-api-servers"><p class="nd-api-label">${esc(this.s.apiServers)}</p><ul>${items.join("")}</ul></div>` : "";
  }

  private auth(): string {
    const schemes = this.v2 ? this.root.securityDefinitions : this.root.components?.securitySchemes;
    const list = entries(schemes);
    if (!list.length) return "";
    const id = this.slug("authentication");
    this.toc.push({ id, text: this.s.apiAuth, level: 2 });
    const items = list.map(([name, raw]) => {
      const scheme = this.deref(raw).node;
      if (!isObj(scheme)) return "";
      const facts = [scheme.type, scheme.scheme, scheme.bearerFormat, scheme.in && scheme.name ? `${scheme.in}: ${scheme.name}` : ""];
      return `<li><div class="nd-api-prop-head"><code class="nd-api-name">${esc(name)}</code><span class="nd-api-type">${esc(facts.filter(Boolean).join(" · "))}</span></div>${scheme.description ? `<div class="nd-api-desc">${this.md(scheme.description)}</div>` : ""}</li>`;
    });
    return `<h2 id="${escapeAttr(id)}">${this.anchor(id)}${esc(this.s.apiAuth)}</h2><ul class="nd-api-props">${items.join("")}</ul>`;
  }

  // ── Operations ──────────────────────────────────────────────────────────

  private operations(): Operation[] {
    const ops: Operation[] = [];
    for (const [path, rawItem] of entries(this.root.paths)) {
      const item = this.deref(rawItem).node;
      if (!isObj(item)) continue;
      for (const method of METHODS) if (isObj(item[method])) ops.push(this.model(path, method, item[method], item));
    }
    return ops;
  }

  /** Normalize an operation: merge path-level parameters and map Swagger 2.0 bodies/responses to OpenAPI 3 shapes. */
  private model(path: string, method: string, op: J, item: J): Operation {
    const byKey = new Map<string, J>();
    for (const raw of [...(Array.isArray(item.parameters) ? item.parameters : []), ...(Array.isArray(op.parameters) ? op.parameters : [])]) {
      const p = this.deref(raw).node;
      if (isObj(p)) byKey.set(`${p.in}:${p.name}`, p);
    }
    let params = [...byKey.values()];
    let body: J = op.requestBody ? this.deref(op.requestBody).node : undefined;
    let responses = entries(op.responses).map(([code, r]) => [code, this.deref(r).node] as [string, J]);

    if (this.v2) {
      const consumes: string[] = op.consumes ?? this.root.consumes ?? ["application/json"];
      const produces: string[] = op.produces ?? this.root.produces ?? ["application/json"];
      const bodyParam = params.find((p) => p.in === "body");
      const form = params.filter((p) => p.in === "formData");
      if (bodyParam) {
        body = { description: bodyParam.description, required: bodyParam.required, content: Object.fromEntries(consumes.map((mt) => [mt, { schema: bodyParam.schema }])) };
      } else if (form.length) {
        const mt = consumes.find((c) => /form/.test(c)) ?? (form.some((p) => p.type === "file") ? "multipart/form-data" : "application/x-www-form-urlencoded");
        const schema = { type: "object", properties: Object.fromEntries(form.map((p) => [p.name, p])), required: form.filter((p) => p.required).map((p) => p.name) };
        body = { content: { [mt]: { schema } } };
      }
      params = params.filter((p) => p.in !== "body" && p.in !== "formData");
      responses = responses.map(([code, r]) => {
        if (!isObj(r)) return [code, r];
        const content = r.schema ? Object.fromEntries(produces.map((mt) => [mt, { schema: r.schema, example: r.examples?.[mt] }])) : undefined;
        return [code, { description: r.description, headers: r.headers, content }];
      });
    }

    const id = this.slug("op-" + (op.operationId || `${method}-${path}`));
    const security = Array.isArray(op.security) ? op.security : Array.isArray(this.root.security) ? this.root.security : undefined;
    const tags = Array.isArray(op.tags) ? op.tags.join(" ") : "";
    this.search.set(id, `${method} ${path} ${op.summary ?? ""} ${op.operationId ?? ""} ${tags}`.toLowerCase());
    this.text.push(`${method.toUpperCase()} ${path} ${op.summary ?? ""} ${typeof op.description === "string" ? op.description : ""}`);
    const model: Operation = { id, method, path, op, params, responses };
    if (body) model.body = body;
    if (security) model.security = security;
    return model;
  }

  /** Group operations by their first tag: declared tags first, then in order of appearance. */
  private groups(ops: Operation[]): Map<string, Operation[]> {
    const groups = new Map<string, Operation[]>();
    for (const tag of Array.isArray(this.root.tags) ? this.root.tags : []) {
      if (isObj(tag) && typeof tag.name === "string") groups.set(tag.name, []);
    }
    for (const op of ops) {
      const name = Array.isArray(op.op.tags) && op.op.tags.length ? String(op.op.tags[0]) : this.s.apiEndpoints;
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name)!.push(op);
    }
    for (const [name, list] of groups) if (!list.length) groups.delete(name);
    return groups;
  }

  private operation(op: Operation): string {
    const path = esc(op.path).replace(/\{([^}]+)\}/g, '<span class="nd-api-pp">{$1}</span>');
    const deprecated = op.op.deprecated === true;
    const summary = op.op.summary ? `<span class="nd-api-summary">${esc(String(op.op.summary))}</span>` : "";
    const flag = deprecated ? `<span class="nd-api-flag">${esc(this.s.apiDeprecated)}</span>` : "";
    this.bodies.set(op.id, () => this.operationBody(op));
    return `<details class="nd-api-op nd-api-m-${op.method}${deprecated ? " nd-api-deprecated" : ""}" id="${escapeAttr(op.id)}"><summary><span class="nd-api-method">${op.method}</span><code class="nd-api-path">${path}</code>${summary}${flag}</summary><div class="nd-api-body"></div></details>`;
  }

  private operationBody(op: Operation): string {
    const s = this.s, o = op.op, out: string[] = [];
    if (o.description) out.push(this.md(o.description));
    if (isObj(o.externalDocs) && typeof o.externalDocs.url === "string") {
      out.push(`<p><a href="${escapeAttr(o.externalDocs.url)}">${esc(String(o.externalDocs.description || o.externalDocs.url))}</a></p>`);
    }
    const security = (op.security ?? []).filter(isObj).map((req) =>
      entries(req).map(([name, scopes]) => `<code>${esc(name)}${Array.isArray(scopes) && scopes.length ? ` (${esc(scopes.join(", "))})` : ""}</code>`).join(" + "));
    if (security.length) out.push(`<p class="nd-api-security"><span class="nd-api-label">${esc(s.apiAuth)}</span> ${security.join(` <span class="nd-api-muted">/</span> `)}</p>`);

    if (op.params.length) {
      const items = op.params.map((p) => {
        const schema = this.v2 ? p : p.schema ?? (Object.values(isObj(p.content) ? p.content : {})[0] as J)?.schema;
        return this.item(String(p.name), schema ?? {}, p.required === true, { depth: 0, seen: new Set(), budget: { n: NODE_BUDGET }, mode: "req" }, p.in, p.description, p.deprecated);
      });
      out.push(`<p class="nd-api-label">${esc(s.apiParameters)}</p><ul class="nd-api-props">${items.join("")}</ul>`);
    }

    if (isObj(op.body)) {
      const required = op.body.required ? ` <span class="nd-api-required">${esc(s.apiRequired)}</span>` : "";
      out.push(`<p class="nd-api-label">${esc(s.apiRequestBody)}${required}</p>`);
      if (op.body.description) out.push(this.md(op.body.description));
      out.push(this.content(op.body.content, "req"));
    }

    if (op.responses.length) {
      out.push(`<p class="nd-api-label">${esc(s.apiResponses)}</p><div class="nd-api-responses">`);
      let opened = false;
      for (const [code, r] of op.responses) {
        const response = isObj(r) ? r : {};
        const desc = String(response.description ?? "");
        const first = desc.split("\n")[0]!.replace(/[*_`#>]/g, "").trim();
        const headers = entries(response.headers).map(([name, h0]) => {
          const h = this.deref(h0).node ?? {};
          return this.item(name, h.schema ?? h, h.required === true, { depth: 0, seen: new Set(), budget: { n: NODE_BUDGET }, mode: "res" }, undefined, h.description);
        });
        const inner = (desc.trim() !== first ? this.md(desc) : "") +
          (headers.length ? `<p class="nd-api-label">${esc(s.apiHeaders)}</p><ul class="nd-api-props">${headers.join("")}</ul>` : "") +
          this.content(response.content, "res");
        const status = `<span class="nd-api-status nd-api-s${/^[1-5]/.test(code) ? code[0] : "x"}">${esc(code)}</span><span class="nd-api-response-desc">${esc(first)}</span>`;
        if (!inner) { out.push(`<div class="nd-api-response">${status}</div>`); continue; }
        const open = !opened && /^2/.test(code);
        if (open) opened = true;
        out.push(`<details class="nd-api-response"${open ? " open" : ""}><summary>${status}</summary><div class="nd-api-response-body">${inner}</div></details>`);
      }
      out.push(`</div>`);
    }
    return out.join("\n");
  }

  // ── Media types, schemas and examples ───────────────────────────────────

  private content(content: J, mode: TreeCtx["mode"]): string {
    const list = entries(content).slice(0, 12);
    if (!list.length) return "";
    if (list.length === 1) {
      const [mt, media] = list[0]!;
      return `<p class="nd-api-mt"><code>${esc(mt)}</code></p>${this.media(mt, media, mode)}`;
    }
    return `<div class="nd-tabs nd-api-media">${list.map(([mt, media]) => `<div class="nd-tab-panel" data-label="${escapeAttr(mt)}">${this.media(mt, media, mode)}</div>`).join("")}</div>`;
  }

  private media(mt: string, raw: J, mode: TreeCtx["mode"]): string {
    const media = this.deref(raw).node;
    if (!isObj(media)) return "";
    const schema = media.schema;
    const tree = schema ? `<div class="nd-api-schema-head"><span class="nd-api-type">${this.type(schema)}</span></div>${this.tree(schema, mode)}` : "";
    const example = this.examples(mt, media, mode);
    if (tree && example) {
      return `<div class="nd-tabs nd-api-views" data-sync="nd-api-view"><div class="nd-tab-panel" data-label="${escapeAttr(this.s.apiSchema)}">${tree}</div><div class="nd-tab-panel" data-label="${escapeAttr(this.s.apiExample)}">${example}</div></div>`;
    }
    return tree || example;
  }

  private examples(mt: string, media: J, mode: TreeCtx["mode"]): string {
    if (media.example !== undefined) return this.code(mt, media.example);
    const named = Object.values(isObj(media.examples) ? media.examples : {}).map((ex) => this.deref(ex).node).find((ex) => isObj(ex) && "value" in ex);
    if (named) return this.code(mt, named.value);
    if (media.schema) {
      const value = this.sample(media.schema, mode, 0, new Set(), { n: 2000 });
      if (value !== undefined) return this.code(mt, value);
    }
    return "";
  }

  private code(mt: string, value: unknown): string {
    const json = typeof value !== "string" || /json/i.test(mt);
    let text = typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? "";
    if (text.length > MAX_EXAMPLE_CHARS) text = text.slice(0, MAX_EXAMPLE_CHARS) + "\n…";
    return `<pre><code data-lang="${json ? "json" : "text"}">${json ? highlight(text, "json") : esc(text)}\n</code></pre>`;
  }

  /** A schema's members (properties, variants, map values) as a nested list. */
  private tree(schema: J, mode: TreeCtx["mode"]): string {
    return this.members(schema, { depth: 0, seen: new Set(), budget: { n: NODE_BUDGET }, mode });
  }

  private members(raw: J, ctx: TreeCtx): string {
    let node = this.deref(raw).node;
    if (!isObj(node)) return "";
    // Arrays document their items.
    for (let guard = 0; this.isArray(node) && isObj(node.items) && guard < 4; guard++) node = this.deref(node.items).node;
    if (!isObj(node)) return "";
    ctx.seen.add(node);
    let html = "";
    const variants = node.oneOf ?? node.anyOf;
    if (Array.isArray(variants) && variants.length) {
      const label = node.oneOf ? this.s.apiOneOf : this.s.apiAnyOf;
      html += `<div class="nd-api-variants"><p class="nd-api-label">${esc(label)}</p>${variants.slice(0, 20).map((v: J, k: number) => {
        const inner = this.members(v, { ...ctx, depth: ctx.depth + 1 });
        const title = this.deref(v).node?.title;
        const head = `${this.type(v, 0, false)}${title ? ` <span class="nd-api-muted">${esc(String(title))}</span>` : ""}`;
        return inner ? `<details class="nd-api-nested"${k === 0 ? " open" : ""}><summary>${head}</summary>${inner}</details>` : `<p class="nd-api-variant">${head}</p>`;
      }).join("")}</div>`;
    }
    const flat = this.flat(node);
    const items = flat.props.map(([name, prop]) => this.item(name, prop, flat.required.has(name), ctx));
    if (isObj(flat.extra)) items.push(this.item("[key]", flat.extra, false, ctx));
    if (items.some(Boolean)) html += `<ul class="nd-api-props">${items.join("")}</ul>`;
    ctx.seen.delete(node);
    return html;
  }

  /** One property, parameter or header row, with nested members when it has any. */
  private item(name: string, raw: J, required: boolean, ctx: TreeCtx, location?: string, description?: unknown, deprecated?: boolean): string {
    if (ctx.budget.n-- <= 0) return ctx.budget.n === -1 ? `<li class="nd-api-muted">…</li>` : "";
    const node = this.deref(raw).node;
    if (!isObj(node)) return "";
    if ((ctx.mode === "req" && node.readOnly) || (ctx.mode === "res" && node.writeOnly)) return "";
    const flags = [
      location ? `<span class="nd-api-in">${esc(location)}</span>` : "",
      required ? `<span class="nd-api-required">${esc(this.s.apiRequired)}</span>` : "",
      deprecated || node.deprecated ? `<span class="nd-api-flag">${esc(this.s.apiDeprecated)}</span>` : "",
      node.readOnly ? `<span class="nd-api-flag">read-only</span>` : "",
      node.writeOnly ? `<span class="nd-api-flag">write-only</span>` : "",
    ].join("");
    const desc = description ?? (isObj(raw) ? raw.description : undefined) ?? node.description;
    let html = `<li><div class="nd-api-prop-head"><code class="nd-api-name">${esc(name)}</code><span class="nd-api-type">${this.type(raw)}</span>${flags}</div>`;
    if (desc) html += `<div class="nd-api-desc">${this.md(desc)}</div>`;
    html += this.facts(node);

    let target = node;
    for (let guard = 0; this.isArray(target) && isObj(target.items) && guard < 4; guard++) target = this.deref(target.items).node;
    if (isObj(target) && this.hasMembers(target)) {
      if (ctx.seen.has(target)) {
        html += `<p class="nd-api-muted">↻ ${esc(this.s.apiRecursive)}</p>`;
      } else if (ctx.depth >= MAX_DEPTH) {
        html += `<p class="nd-api-muted">…</p>`;
      } else {
        const inner = this.members(target, { ...ctx, depth: ctx.depth + 1 });
        if (inner) html += `<details class="nd-api-nested"${ctx.depth === 0 ? " open" : ""}><summary>${esc(this.s.apiProperties)}</summary>${inner}</details>`;
      }
    }
    return html + `</li>`;
  }

  private hasMembers(node: J): boolean {
    return isObj(node.properties) || Array.isArray(node.allOf) || Array.isArray(node.oneOf) || Array.isArray(node.anyOf) || isObj(node.additionalProperties);
  }

  private isArray(node: J): boolean {
    return node.type === "array" || (Array.isArray(node.type) && node.type.includes("array")) || (!node.type && isObj(node.items));
  }

  /** Merge `allOf` parts into one property list. */
  private flat(raw: J, seen = new Set<object>()): { props: [string, J][]; required: Set<string>; extra: J } {
    const node = this.deref(raw).node;
    const result = { props: [] as [string, J][], required: new Set<string>(), extra: undefined as J };
    if (!isObj(node) || seen.has(node)) return result;
    seen.add(node);
    const props = new Map<string, J>();
    for (const part of Array.isArray(node.allOf) ? node.allOf : []) {
      const sub = this.flat(part, seen);
      for (const [k, v] of sub.props) props.set(k, v);
      for (const r of sub.required) result.required.add(r);
      result.extra ??= sub.extra;
    }
    for (const [k, v] of entries(node.properties)) props.set(k, v);
    for (const r of Array.isArray(node.required) ? node.required : []) result.required.add(String(r));
    if (isObj(node.additionalProperties)) result.extra = node.additionalProperties;
    result.props = [...props];
    return result;
  }

  /** A compact type label (HTML), linking named schemas to their section. */
  private type(raw: J, depth = 0, link = true): string {
    const { node, name } = this.deref(raw);
    if (name) {
      const id = isObj(node) ? this.refIds.get(node) : undefined;
      return link && id ? `<a href="#${escapeAttr(id)}">${esc(name)}</a>` : esc(name);
    }
    if (!isObj(node) || depth > 3) return "any";
    if (Array.isArray(node.allOf) && node.allOf.length === 1 && !node.properties) return this.type(node.allOf[0], depth + 1, link);
    const types: string[] = Array.isArray(node.type) ? node.type.map(String) : node.type ? [String(node.type)] : [];
    if (node.nullable === true && !types.includes("null")) types.push("null");
    const main = types.find((t) => t !== "null");
    let label: string;
    if (main === "array" || (!main && isObj(node.items))) {
      label = `array&lt;${isObj(node.items) ? this.type(node.items, depth + 1, link) : "any"}&gt;`;
    } else if (main) {
      label = esc(main);
    } else if (node.oneOf || node.anyOf) {
      label = esc(node.oneOf ? "oneOf" : "anyOf");
    } else if (node.properties || node.allOf || node.additionalProperties) {
      label = "object";
    } else if (Array.isArray(node.enum) && node.enum.length) {
      label = esc(typeof node.enum[0]);
    } else if (node.const !== undefined) {
      label = esc(typeof node.const);
    } else {
      label = "any";
    }
    if (main === "object" && isObj(node.additionalProperties) && !node.properties) {
      label = `map&lt;string, ${this.type(node.additionalProperties, depth + 1, link)}&gt;`;
    }
    if (node.format) label += ` <span class="nd-api-format">${esc(String(node.format))}</span>`;
    if (types.includes("null")) label += " | null";
    return label;
  }

  /** Enum, default, example and range constraints. */
  private facts(node: J): string {
    if (!isObj(node)) return "";
    const facts: string[] = [];
    const lit = (v: unknown): string => `<code>${esc(typeof v === "string" ? v : JSON.stringify(v) ?? "")}</code>`;
    if (Array.isArray(node.enum) && node.enum.length) facts.push(`${esc(this.s.apiEnum)}: ${node.enum.slice(0, 40).map(lit).join(" ")}${node.enum.length > 40 ? " …" : ""}`);
    if (node.const !== undefined) facts.push(`${esc(this.s.apiEnum)}: ${lit(node.const)}`);
    if (node.default !== undefined) facts.push(`${esc(this.s.apiDefault)}: ${lit(node.default)}`);
    if (node.example !== undefined && !isObj(node.example) && !Array.isArray(node.example)) facts.push(`${esc(this.s.apiExample)}: ${lit(node.example)}`);
    if (typeof node.pattern === "string") facts.push(`pattern ${lit(node.pattern)}`);
    return facts.length ? `<div class="nd-api-facts">${facts.map((f) => `<span>${f}</span>`).join("")}</div>` : "";
  }

  /** Generate a representative example value from a schema. */
  private sample(raw: J, mode: TreeCtx["mode"], depth: number, seen: Set<object>, budget: { n: number }): unknown {
    const node = this.deref(raw).node;
    if (!isObj(node) || depth > MAX_DEPTH || seen.has(node) || budget.n-- <= 0) return undefined;
    if (node.example !== undefined) return node.example;
    if (Array.isArray(node.examples) && node.examples.length) return node.examples[0];
    if (node.const !== undefined) return node.const;
    if (node.default !== undefined) return node.default;
    if (Array.isArray(node.enum) && node.enum.length) return node.enum[0];
    seen.add(node);
    try {
      const variants = node.oneOf ?? node.anyOf;
      if (Array.isArray(variants) && variants.length) return this.sample(variants[0], mode, depth + 1, seen, budget);
      const type = Array.isArray(node.type) ? node.type.find((t: unknown) => t !== "null") : node.type;
      if (this.isArray(node)) {
        const item = this.sample(node.items, mode, depth + 1, seen, budget);
        return item === undefined ? [] : [item];
      }
      if (type === "object" || this.hasMembers(node)) {
        const flat = this.flat(node);
        if (!flat.props.length && Array.isArray(node.allOf) && node.allOf.length) return this.sample(node.allOf[0], mode, depth + 1, seen, budget);
        const out: Record<string, unknown> = {};
        for (const [key, prop] of flat.props) {
          const p = this.deref(prop).node;
          if (isObj(p) && ((mode === "req" && p.readOnly) || (mode === "res" && p.writeOnly))) continue;
          const value = this.sample(prop, mode, depth + 1, seen, budget);
          if (value !== undefined) Object.defineProperty(out, key, { value, enumerable: true, writable: true, configurable: true });
        }
        if (!flat.props.length && isObj(flat.extra)) {
          const value = this.sample(flat.extra, mode, depth + 1, seen, budget);
          if (value !== undefined) out.key = value;
        }
        return out;
      }
      switch (type) {
        case "string": return this.sampleString(node.format);
        case "integer":
        case "number": return typeof node.minimum === "number" ? node.minimum : 0;
        case "boolean": return true;
        case "null": return null;
        case "file": return "<binary>";
        default: return undefined;
      }
    } finally {
      seen.delete(node);
    }
  }

  private sampleString(format: unknown): string {
    const samples: Record<string, string> = {
      "date-time": "2024-01-15T09:30:00Z", date: "2024-01-15", email: "user@example.com",
      uuid: "3fa85f64-5717-4562-b3fc-2c963f66afa6", uri: "https://example.com", binary: "<binary>",
    };
    return samples[String(format)] ?? "string";
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Follow local `$ref`s (JSON Pointer). External references resolve to an empty schema with their name. */
  private deref(raw: J): { node: J; name?: string } {
    let node = raw;
    let name: string | undefined;
    for (let hops = 0; isObj(node) && typeof node.$ref === "string" && hops < 32; hops++) {
      const ref: string = node.$ref;
      name = decodePointer(ref.split("/").pop() || ref);
      if (!ref.startsWith("#")) return { node: {}, name };
      node = pointer(this.root, ref.slice(1));
    }
    return name === undefined ? { node } : { node: node ?? {}, name };
  }

  private md(text: unknown): string {
    return renderMarkdown(String(text), { usedIds: this.used }).html;
  }

  private slug(text: string): string {
    return slugify(text, this.used);
  }

  private anchor(id: string): string {
    return `<a class="nd-anchor" href="#${escapeAttr(id)}" aria-label="Link to this section">#</a>`;
  }
}

function decodePointer(segment: string): string {
  let s = segment;
  try { s = decodeURIComponent(s); } catch { /* keep raw */ }
  return s.replace(/~1/g, "/").replace(/~0/g, "~");
}

function pointer(root: J, path: string): J {
  let current = root;
  for (const raw of path.replace(/^\//, "").split("/")) {
    if (raw === "" && path === "") break;
    if (!isObj(current) && !Array.isArray(current)) return undefined;
    const key = decodePointer(raw);
    current = Object.prototype.hasOwnProperty.call(current, key) ? (current as Record<string, J>)[key] : undefined;
  }
  return current;
}

/**
 * Wire the rendered API page: lazy bodies, the endpoint filter and expand/
 * collapse controls. `renderBody` turns body HTML into a sanitized fragment
 * through the same pipeline as the page itself.
 */
export function enhanceApi(root: ParentNode, api: ApiRender, renderBody: (html: string) => DocumentFragment, s: UIStrings): void {
  const items = Array.from(root.querySelectorAll<HTMLDetailsElement>("details.nd-api-op, details.nd-api-model"));
  for (const details of items) {
    const build = api.bodies.get(details.id);
    if (!build) continue;
    const hydrate = (): void => {
      if (!details.open || details.dataset.ready) return;
      details.dataset.ready = "true";
      details.querySelector(":scope > .nd-api-body")?.replaceChildren(renderBody(build()));
    };
    details.addEventListener("toggle", hydrate);
  }

  const toolbar = root.querySelector<HTMLElement>(".nd-api-toolbar");
  if (!toolbar) return;
  if (items.length < 2) { toolbar.remove(); return; }
  const input = document.createElement("input");
  input.type = "search";
  input.className = "nd-api-filter";
  input.placeholder = s.apiFilter;
  input.setAttribute("aria-label", s.apiFilter);
  input.autocomplete = "off";
  input.spellcheck = false;
  const button = (label: string, open: boolean): HTMLButtonElement => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "nd-tool-toggle nd-api-toggle-all";
    b.textContent = label;
    b.addEventListener("click", () => { for (const d of items) if (!d.hidden && d.classList.contains("nd-api-op")) d.open = open; });
    return b;
  };
  const empty = document.createElement("p");
  empty.className = "nd-api-empty";
  empty.textContent = s.apiNoMatch;
  empty.hidden = true;
  toolbar.append(input, button(s.apiExpandAll, true), button(s.apiCollapseAll, false));
  toolbar.after(empty);

  const groups = Array.from(root.querySelectorAll<HTMLElement>(".nd-api-tag"));
  let timer = 0;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      for (const d of items) {
        const text = api.search.get(d.id) ?? "";
        d.hidden = terms.length > 0 && !terms.every((t) => text.includes(t));
      }
      let any = false;
      for (const g of groups) {
        const visible = g.querySelector(".nd-api-op:not([hidden]), .nd-api-model:not([hidden])") !== null;
        g.hidden = !visible;
        any ||= visible;
      }
      empty.hidden = any;
    }, 80);
  });
}
