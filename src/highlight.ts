/**
 * Compact, allow-listed syntax highlighter.
 *
 * Per the spec's size budget, we do not embed a full highlighting engine.
 * Instead a small set of token rules covers the common languages; every other
 * language falls back to plain (but still escaped) text. Output is a string of
 * `<span class="tok-*">` fragments over already HTML-escaped input, so it is
 * safe to insert into a sanitized `<code>` element.
 */
import { escapeHtml } from "./sanitize.js";

type Rule = { re: RegExp; cls: string };

// Rules are applied in order; the first match at a position wins. We tokenize
// on a combined regex and classify each match. Keeping this tiny is deliberate.
const COMMON_KEYWORDS =
  "\\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|super|import|export|from|default|async|await|yield|try|catch|finally|throw|typeof|instanceof|in|of|void|delete|null|true|false|undefined|def|elif|None|True|False|lambda|pass|with|as|and|or|not|is|public|private|protected|static|final|interface|enum|struct|impl|fn|use|pub|mut|match|package|func|type|var|nil|end|then|begin|module|require)\\b";

const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  htm: "html",
};

const SUPPORTED = new Set([
  "javascript",
  "typescript",
  "python",
  "ruby",
  "go",
  "rust",
  "java",
  "csharp",
  "c",
  "cpp",
  "json",
  "yaml",
  "bash",
  "html",
  "css",
  "sql",
  "diff",
]);

export function normalizeLang(lang: string | undefined): string | null {
  if (!lang) return null;
  const l = lang.toLowerCase().trim();
  const canonical = LANG_ALIASES[l] || l;
  return SUPPORTED.has(canonical) ? canonical : null;
}

// A single tokenizer covering the common lexical shapes. Order matters.
const RULES: Rule[] = [
  { re: /\/\*[\s\S]*?\*\/|(?:\/\/|#).*$/m, cls: "tok-comment" },
  { re: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/, cls: "tok-string" },
  { re: new RegExp(COMMON_KEYWORDS), cls: "tok-keyword" },
  { re: /\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, cls: "tok-number" },
  { re: /\b[A-Za-z_$][\w$]*(?=\s*\()/, cls: "tok-fn" },
  { re: /[{}()[\];,.]/, cls: "tok-punct" },
  { re: /[+\-*/%=<>!&|^~?:]+/, cls: "tok-op" },
];

const COMBINED = new RegExp(RULES.map((r) => `(${r.re.source})`).join("|"), "gm");

/**
 * Highlight `code` for the given language, returning safe HTML.
 * When the language is unsupported, the code is returned HTML-escaped, unstyled.
 */
export function highlight(code: string, lang: string | null): string {
  if (!lang) return escapeHtml(code);

  let out = "";
  let last = 0;
  COMBINED.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COMBINED.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index));
    // Determine which capture group matched to pick the class.
    let cls = "";
    for (let i = 0; i < RULES.length; i++) {
      if (m[i + 1] !== undefined) {
        cls = RULES[i]!.cls;
        break;
      }
    }
    out += `<span class="${cls}">${escapeHtml(m[0])}</span>`;
    last = m.index + m[0].length;
    if (m[0].length === 0) COMBINED.lastIndex++;
  }
  if (last < code.length) out += escapeHtml(code.slice(last));
  return out;
}
