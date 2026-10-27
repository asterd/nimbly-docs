import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { renderMarkdown } = await load("src/markdown.ts");

test("callout directive with and without a title", () => {
  const { html, text } = renderMarkdown(":::tip Pro tip\nUse **search**.\n:::\n\n:::warning\nCareful\n:::");
  assert.match(html, /<div class="nd-callout" data-kind="tip"><p class="nd-callout-title">Pro tip<\/p><p>Use <strong>search<\/strong>.<\/p><\/div>/);
  assert.match(html, /data-kind="warning"><p class="nd-callout-title"><\/p>/);
  assert.match(text, /Pro tip/);
});

test("GitHub alerts become callouts", () => {
  const { html } = renderMarkdown("> [!CAUTION]\n> Do not do this.");
  assert.match(html, /data-kind="warning"/);
  assert.doesNotMatch(html, /<blockquote>/);
});

test("nested tabs close by depth, not colon count", () => {
  const src = ":::tabs {sync=os}\n:::tab macOS\nbrew install\n:::\n:::tab Linux\napt install\n:::\n:::\nafter";
  const { html } = renderMarkdown(src);
  assert.match(html, /^<div class="nd-tabs" data-sync="os"><div class="nd-tab-panel" data-label="macOS"><p>brew install<\/p><\/div>\n<div class="nd-tab-panel" data-label="Linux"><p>apt install<\/p><\/div><\/div>\n<p>after<\/p>$/);
});

test("code-group builds one panel per fence, labelled by title or language", () => {
  const src = ':::code-group\n```js title="app.js"\nconst a = 1;\n```\n```python\nprint(1)\n```\n:::';
  const { html } = renderMarkdown(src);
  assert.match(html, /<div class="nd-tabs nd-code-group">/);
  assert.match(html, /data-label="app.js"/);
  assert.match(html, /data-label="Python"/);
  assert.match(html, /<code data-lang="javascript" data-title="app.js">/);
});

test("a ::: line inside a fenced block does not close a directive", () => {
  const src = ":::note\n```md\n:::\n```\nstill inside\n:::";
  const { html } = renderMarkdown(src);
  assert.match(html, /still inside<\/p><\/div>$/);
});

test("fence titles with bracket syntax", () => {
  const { html } = renderMarkdown("```bash [install.sh]\nnpm i\n```");
  assert.match(html, /data-title="install.sh"/);
});

test("directive titles and attributes are escaped", () => {
  const { html } = renderMarkdown(':::card <img src=x onerror=alert(1)> {href="javascript:alert(1)"}\nbody\n:::');
  assert.doesNotMatch(html, /<img/);
  // The href survives parsing but is neutralized by the sanitizer (covered by the allow-list).
  assert.match(html, /<div class="nd-card">/);
});

test("unknown directives degrade to their content", () => {
  const { html } = renderMarkdown(":::mystery\nhello\n:::");
  assert.equal(html, "<div><p>hello</p></div>");
});

test("heading ids stay unique across nested content", () => {
  const { html } = renderMarkdown("## Setup\n:::tip\n## Setup\n:::");
  assert.match(html, /id="setup"/);
  assert.match(html, /id="setup-2"/);
});

test("inline badges render as toned chips and stay out of heading ids", () => {
  const { html, toc } = renderMarkdown("## More types :badge[trial]");
  assert.match(html, /<h2 id="more-types">/);
  assert.match(html, /<span class="nd-badge nd-tone-trial">trial<\/span>/);
  assert.equal(toc[0].text, "More types");
});

test("task list items keep a checkbox marker", () => {
  const { html } = renderMarkdown("- [x] done\n- [ ] todo");
  assert.match(html, /<li class="nd-task"><input type="checkbox" disabled checked> done<\/li>/);
});
