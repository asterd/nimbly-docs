/**
 * A compact YAML reader for API descriptions.
 *
 * OpenAPI/Swagger documents are usually YAML, but a full YAML 1.2 engine would
 * dwarf the rest of the bundle. This reader covers the subset real API
 * descriptions use: block mappings and sequences (including sequences at the
 * key's indentation), plain/single/double-quoted scalars (also multi-line),
 * literal and folded block scalars with chomping and indentation indicators,
 * single- and multi-line flow collections, comments, document markers,
 * anchors/aliases and `<<` merge keys. Tags are ignored and complex (`?`) keys
 * are rejected.
 *
 * It produces plain data only: no custom types are ever constructed, aliases
 * share references instead of copying (no "billion laughs" blow-up) and
 * `__proto__` keys are stored as own properties, never as prototypes.
 */
export class YamlError extends Error {
  constructor(message: string, line: number) {
    super(`YAML line ${line + 1}: ${message}`);
    this.name = "YamlError";
  }
}

type Dict = Record<string, unknown>;

const PLAIN_NULL = /^(?:~|null|Null|NULL)?$/;
const PLAIN_BOOL = /^(?:true|True|TRUE|false|False|FALSE)$/;
const PLAIN_INT = /^[-+]?(?:0|[1-9][0-9_]*)$|^0x[0-9a-fA-F]+$|^0o[0-7]+$/;
const PLAIN_FLOAT = /^[-+]?(?:\.[0-9]+|[0-9][0-9_]*(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?$/;

/** Interpret an unquoted scalar with the YAML 1.2 core schema. */
function plainValue(raw: string): unknown {
  const s = raw.trim();
  if (PLAIN_NULL.test(s)) return null;
  if (PLAIN_BOOL.test(s)) return /^t/i.test(s);
  if (PLAIN_INT.test(s)) {
    const n = s.startsWith("0o") ? parseInt(s.slice(2), 8) : Number(s.replace(/_/g, ""));
    if (Number.isSafeInteger(n)) return n;
    return s;
  }
  if (PLAIN_FLOAT.test(s)) return Number(s.replace(/_/g, ""));
  if (/^[-+]?\.(?:inf|Inf|INF)$/.test(s)) return s.startsWith("-") ? -Infinity : Infinity;
  if (/^\.(?:nan|NaN|NAN)$/.test(s)) return NaN;
  return s;
}

function setKey(obj: Dict, key: string, value: unknown): void {
  if (key === "__proto__") Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
  else obj[key] = value;
}

const ESCAPES: Record<string, string> = { n: "\n", t: "\t", r: "\r", "0": "\0", '"': '"', "\\": "\\", "/": "/", " ": " ", b: "\b", f: "\f", e: "\x1b", N: "\x85", _: "\xa0" };

/** Read a quoted scalar starting at `text[pos]`. Returns the value and the index after the closing quote. */
function readQuoted(text: string, pos: number): { value: string; end: number } | null {
  const q = text[pos]!;
  let out = "";
  // Escaped characters are content: line folding must never trim them.
  let hard = 0;
  let i = pos + 1;
  while (i < text.length) {
    const ch = text[i]!;
    if (q === "'" && ch === "'") {
      if (text[i + 1] === "'") { out += "'"; i += 2; continue; }
      return { value: out, end: i + 1 };
    }
    if (q === '"' && ch === '"') return { value: out, end: i + 1 };
    if (q === '"' && ch === "\\") {
      const next = text[i + 1] ?? "";
      if (next === "\n") { i += 2; while (text[i] === " " || text[i] === "\t") i++; continue; }
      const width = next === "x" ? 2 : next === "u" ? 4 : next === "U" ? 8 : 0;
      if (width) {
        const code = parseInt(text.slice(i + 2, i + 2 + width), 16);
        out += Number.isFinite(code) ? String.fromCodePoint(code) : "";
        hard = out.length;
        i += 2 + width;
        continue;
      }
      out += ESCAPES[next] ?? next;
      hard = out.length;
      i += 2;
      continue;
    }
    if (ch === "\n") {
      // Line folding inside quotes: a single break becomes a space, blank lines become breaks.
      out = out.slice(0, hard) + out.slice(hard).replace(/[ \t]+$/, "");
      let breaks = 0;
      while (i < text.length && /[\s]/.test(text[i]!)) { if (text[i] === "\n") breaks++; i++; }
      out += breaks > 1 ? "\n".repeat(breaks - 1) : " ";
      continue;
    }
    out += ch;
    i++;
  }
  return null;
}

/** Remove a trailing ` # comment`, ignoring `#` inside quotes. */
function stripComment(text: string): string {
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quote) {
      if (quote === '"' && ch === "\\") i++;
      else if (ch === quote) quote = "";
    } else if ((ch === '"' || ch === "'") && (i === 0 || /[\s[{,:]/.test(text[i - 1]!))) {
      quote = ch;
    } else if (ch === "#" && (i === 0 || /\s/.test(text[i - 1]!))) {
      return text.slice(0, i).trimEnd();
    }
  }
  return text.trimEnd();
}

/** Split `key: rest` (key optionally quoted). Returns null when the text is not a mapping entry. */
function splitKey(text: string): { key: string; rest: string } | null {
  if (text.startsWith('"') || text.startsWith("'")) {
    const q = readQuoted(text, 0);
    if (!q) return null;
    const after = text.slice(q.end);
    const m = /^\s*:(?:\s|$)/.exec(after);
    return m ? { key: q.value, rest: after.slice(m[0].length).trim() } : null;
  }
  if (/^[[{!&*|>%@`]/.test(text) || text.startsWith("- ")) return null;
  const m = /:(?:\s|$)/.exec(text);
  if (!m) return null;
  return { key: text.slice(0, m.index).trim(), rest: text.slice(m.index + 1).trim() };
}

/** Parse a YAML document into plain JavaScript values. */
export function parseYaml(source: string): unknown {
  const lines = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const anchors = new Map<string, unknown>();
  let i = 0;

  const indentOf = (line: string): number => line.length - line.trimStart().length;
  const ignorable = (line: string): boolean => {
    const t = line.trim();
    return t === "" || t.startsWith("#") || (indentOf(line) === 0 && (/^(?:---|\.\.\.)(?:\s|$)/.test(t) || t.startsWith("%")));
  };
  const skip = (): void => { while (i < lines.length && ignorable(lines[i]!)) i++; };
  const isSeqItem = (text: string): boolean => text === "-" || text.startsWith("- ") || text.startsWith("-\t");

  // A document may start with `--- value` on the marker line.
  skip();
  const first = lines[i];
  if (first !== undefined && /^---\s+\S/.test(first)) lines[i] = first.replace(/^---\s+/, "");

  /** Parse the block node whose first line is `lines[i]` at exactly `indent`. */
  function parseBlock(indent: number): unknown {
    const text = stripComment(lines[i]!.slice(indent));
    if (isSeqItem(text)) return parseSeq(indent);
    if (splitKey(text)) return parseMap(indent);
    const start = i++;
    return parseValue(text, indent - 1, start);
  }

  function parseMap(indent: number): Dict {
    const obj: Dict = {};
    while (true) {
      skip();
      if (i >= lines.length) break;
      const line = lines[i]!;
      const ind = indentOf(line);
      if (ind < indent) break;
      if (ind > indent) throw new YamlError("unexpected indentation", i);
      const text = stripComment(line.slice(indent));
      if (isSeqItem(text)) break;
      if (text.startsWith("? ")) throw new YamlError("complex keys are not supported", i);
      const entry = splitKey(text);
      if (!entry) throw new YamlError("expected a mapping entry", i);
      const start = i++;
      const value = parseValue(entry.rest, indent, start, true);
      if (entry.key === "<<") {
        for (const src of Array.isArray(value) ? value : [value]) {
          if (src && typeof src === "object" && !Array.isArray(src)) {
            for (const [k, v] of Object.entries(src as Dict)) if (!(k in obj)) setKey(obj, k, v);
          }
        }
      } else {
        setKey(obj, entry.key, value);
      }
    }
    return obj;
  }

  function parseSeq(indent: number): unknown[] {
    const arr: unknown[] = [];
    while (true) {
      skip();
      if (i >= lines.length) break;
      const line = lines[i]!;
      if (indentOf(line) !== indent) break;
      const text = stripComment(line.slice(indent));
      if (!isSeqItem(text)) break;
      const after = text.slice(1);
      const content = after.trimStart();
      if (content === "") {
        const start = i++;
        arr.push(parseValue("", indent, start));
        continue;
      }
      const column = indent + 1 + (after.length - content.length);
      // `- key: value` or `- - nested`: re-read this line as a block node at the item column.
      if (isSeqItem(content) || (splitKey(content) && !/^[&!]/.test(content))) {
        lines[i] = " ".repeat(column) + content;
        arr.push(parseBlock(column));
        continue;
      }
      const start = i++;
      arr.push(parseValue(content, indent, start));
    }
    return arr;
  }

  /**
   * Parse the value that follows `key:` or `- ` on line `start`. `parent` is the
   * indentation of the owning key/dash; nested blocks must be indented deeper
   * (or, for a mapping value, may be a sequence at the same indentation).
   */
  function parseValue(rest: string, parent: number, start: number, mapValue = false): unknown {
    let text = rest;
    let anchor = "";
    for (;;) {
      const prop = /^([&!])(\S*)\s*/.exec(text);
      if (!prop) break;
      if (prop[1] === "&") anchor = prop[2]!;
      text = text.slice(prop[0].length);
    }
    const keep = (value: unknown): unknown => { if (anchor) anchors.set(anchor, value); return value; };

    if (text === "") {
      skip();
      if (i < lines.length) {
        const ind = indentOf(lines[i]!);
        const nextText = lines[i]!.slice(ind);
        if (ind > parent) return keep(parseBlock(ind));
        if (mapValue && ind === parent && isSeqItem(stripComment(nextText))) return keep(parseSeq(ind));
      }
      return keep(null);
    }
    if (text.startsWith("*")) {
      const name = text.slice(1).trim();
      if (!anchors.has(name)) throw new YamlError(`unknown alias "${name}"`, start);
      return anchors.get(name);
    }
    if (text.startsWith("|") || text.startsWith(">")) return keep(blockScalar(text, parent, start));
    if (text.startsWith("[") || text.startsWith("{")) {
      let src = text;
      while (!balanced(src) && i < lines.length) src += "\n" + stripComment(lines[i++]!.trim());
      const reader = { s: src, p: 0 };
      const value = flowValue(reader, start);
      return keep(value);
    }
    if (text.startsWith('"') || text.startsWith("'")) {
      let src = text;
      let q = readQuoted(src, 0);
      while (!q && i < lines.length) { src += "\n" + lines[i++]!; q = readQuoted(src, 0); }
      if (!q) throw new YamlError("unterminated quoted scalar", start);
      return keep(q.value);
    }
    // Plain scalar, possibly continued on more-indented lines.
    let value = text;
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.trim() === "") {
        let j = i;
        while (j < lines.length && lines[j]!.trim() === "") j++;
        if (j < lines.length && indentOf(lines[j]!) > parent && !lines[j]!.trim().startsWith("#")) {
          value += "\n".repeat(j - i);
          i = j;
          continue;
        }
        break;
      }
      const t = line.trim();
      // More-indented lines always continue a plain scalar, even when they look like `- x` or `k: v`.
      if (indentOf(line) <= parent || t.startsWith("#")) break;
      value += (value.endsWith("\n") ? "" : " ") + stripComment(t);
      i++;
    }
    return keep(value.includes("\n") || value !== text ? value : plainValue(value));
  }

  function blockScalar(header: string, parent: number, start: number): string {
    const m = /^([|>])(?:([1-9])([+-])?|([+-])([1-9])?)?\s*$/.exec(header.replace(/\s+#.*$/, ""));
    if (!m) throw new YamlError("invalid block scalar header", start);
    const folded = m[1] === ">";
    const explicit = Number(m[2] || m[5] || 0);
    const chomp = m[3] || m[4] || "";
    // An explicit indentation indicator is relative to the owning node's indentation.
    let blockIndent = explicit ? Math.max(parent, 0) + explicit : -1;
    const body: string[] = [];
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.trim() === "") { body.push(""); i++; continue; }
      const ind = indentOf(line);
      if (blockIndent < 0) {
        if (ind <= parent) break;
        blockIndent = ind;
      }
      if (ind < blockIndent) break;
      body.push(line.slice(blockIndent));
      i++;
    }
    // Trailing blank lines belong to the chomping, not the content.
    let trailing = 0;
    while (body.length && body[body.length - 1] === "") { body.pop(); trailing++; }
    let out = "";
    if (folded) {
      let prevMore = false;
      for (const line of body) {
        const more = /^\s/.test(line);
        if (line === "") out += "\n";
        else if (out === "") out = line;
        else if (out.endsWith("\n") || more || prevMore) out += (out.endsWith("\n") ? "" : "\n") + line;
        else out += " " + line;
        if (line !== "") prevMore = more;
      }
    } else {
      out = body.join("\n");
    }
    if (chomp === "-" || out === "") return out;
    return out + (chomp === "+" ? "\n".repeat(trailing + 1) : "\n");
  }

  return parseDocument();

  function parseDocument(): unknown {
    skip();
    if (i >= lines.length) return null;
    const value = parseBlock(indentOf(lines[i]!));
    skip();
    if (i < lines.length && !/^(?:---|\.\.\.)/.test(lines[i]!)) throw new YamlError("unexpected content", i);
    return value;
  }

  function flowValue(r: { s: string; p: number }, line: number): unknown {
    ws(r);
    const ch = r.s[r.p];
    if (ch === "[") {
      r.p++;
      const arr: unknown[] = [];
      for (;;) {
        ws(r);
        if (r.s[r.p] === "]") { r.p++; return arr; }
        if (r.p >= r.s.length) throw new YamlError("unterminated flow sequence", line);
        const item = flowEntry(r, line, "]");
        arr.push(item.key !== undefined ? { [item.key]: item.value } : item.value);
        ws(r);
        if (r.s[r.p] === ",") r.p++;
      }
    }
    if (ch === "{") {
      r.p++;
      const obj: Dict = {};
      for (;;) {
        ws(r);
        if (r.s[r.p] === "}") { r.p++; return obj; }
        if (r.p >= r.s.length) throw new YamlError("unterminated flow mapping", line);
        const item = flowEntry(r, line, "}");
        if (item.key !== undefined) setKey(obj, item.key, item.value);
        else if (typeof item.value === "string") setKey(obj, item.value, null);
        ws(r);
        if (r.s[r.p] === ",") r.p++;
      }
    }
    if (ch === '"' || ch === "'") {
      const q = readQuoted(r.s, r.p);
      if (!q) throw new YamlError("unterminated quoted scalar", line);
      r.p = q.end;
      return q.value;
    }
    if (ch === "*") {
      const m = /^\*([^\s,[\]{}]+)/.exec(r.s.slice(r.p))!;
      r.p += m[0].length;
      if (!anchors.has(m[1]!)) throw new YamlError(`unknown alias "${m[1]}"`, line);
      return anchors.get(m[1]!);
    }
    return plainValue(flowPlain(r, false));
  }

  /** One `[ ]`/`{ }` entry: either a value or a `key: value` pair. */
  function flowEntry(r: { s: string; p: number }, line: number, close: string): { key?: string; value: unknown } {
    const at = r.p;
    let key: string | undefined;
    const ch = r.s[r.p];
    if (ch === '"' || ch === "'") {
      const q = readQuoted(r.s, r.p);
      if (q && /^\s*:/.test(r.s.slice(q.end))) { key = q.value; r.p = q.end; }
    } else if (ch !== "[" && ch !== "{") {
      const plain = flowPlain(r, true);
      if (r.s[r.p] === ":") key = plain.trim();
      else r.p = at;
    }
    if (key !== undefined) {
      r.p++; // ':'
      ws(r);
      if (r.s[r.p] === "," || r.s[r.p] === close) return { key, value: null };
      return { key, value: flowValue(r, line) };
    }
    return { value: flowValue(r, line) };
  }

  function flowPlain(r: { s: string; p: number }, asKey: boolean): string {
    const start = r.p;
    while (r.p < r.s.length) {
      const ch = r.s[r.p]!;
      if (ch === "," || ch === "]" || ch === "}" || ch === "[" || ch === "{") break;
      if (ch === ":" && (asKey || /[\s,\]}]/.test(r.s[r.p + 1] ?? " "))) break;
      r.p++;
    }
    return r.s.slice(start, r.p).replace(/\s+/g, " ").trim();
  }

  function ws(r: { s: string; p: number }): void {
    while (r.p < r.s.length && /\s/.test(r.s[r.p]!)) r.p++;
  }
}

/** True when every `[`/`{` outside quotes has been closed. */
function balanced(text: string): boolean {
  let depth = 0;
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quote) {
      if (quote === '"' && ch === "\\") i++;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "[" || ch === "{") depth++;
    else if (ch === "]" || ch === "}") depth--;
  }
  return depth <= 0;
}
