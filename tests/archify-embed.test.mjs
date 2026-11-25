import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { parseSpec, resolveEmbedUrl, frameUrl, standaloneUrl } = await load("src/plugins/archify-embed.ts");

const here = { href: "https://docs.example.com/index.html", origin: "https://docs.example.com" };

test("only links titled 'archify' are embeds", () => {
  assert.equal(parseSpec(null), null);
  assert.equal(parseSpec("A normal title"), null);
  assert.equal(parseSpec("archifyx"), null);
  assert.deepEqual(parseSpec("archify"), { height: 560, ratio: null });
  assert.deepEqual(parseSpec("Archify height=700"), { height: 700, ratio: null });
});

test("height is clamped and junk options are ignored", () => {
  assert.equal(parseSpec("archify height=9999").height, 1600);
  assert.equal(parseSpec("archify height=100").height, 240);
  assert.equal(parseSpec("archify height=abc onload=alert(1)").height, 560);
});

test("embeds must be same-origin .html files inside the approved folder", () => {
  const ok = resolveEmbedUrl("https://docs.example.com/diagrams/a.html", "./diagrams/", here);
  assert.equal(ok?.pathname, "/diagrams/a.html");
  assert.ok(resolveEmbedUrl("/diagrams/sub/b.html#focus=api", "./diagrams", here));
  assert.equal(resolveEmbedUrl("https://evil.example.org/diagrams/a.html", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("/other/a.html", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("/diagrams/a.svg", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("/diagrams/a.html.js", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("/diagrams/../secret/a.html", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("/diagrams-private/a.html", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("javascript:alert(1)", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("data:text/html,<script>1</script>", "./diagrams/", here), null);
  assert.equal(resolveEmbedUrl("https://user:pw@docs.example.com/diagrams/a.html", "./diagrams/", here), null);
});

test("frame URL is rebuilt from validated parts", () => {
  const url = resolveEmbedUrl("/diagrams/a.html?x=1&theme=evil#focus=api", "./diagrams/", here);
  assert.equal(frameUrl(url, "dark"), "https://docs.example.com/diagrams/a.html?embed=1&theme=dark#focus=api");
  assert.equal(standaloneUrl(url, "light"), "https://docs.example.com/diagrams/a.html?theme=light#focus=api");
});

test("ratio accepts W:H or WxH and ignores anything else", () => {
  assert.deepEqual(parseSpec("archify ratio=1080:640").ratio, [1080, 640]);
  assert.deepEqual(parseSpec("archify ratio=1440x900 height=700"), { height: 700, ratio: [1440, 900] });
  assert.equal(parseSpec("archify ratio=1:1").ratio, null);
  assert.equal(parseSpec("archify ratio=wide").ratio, null);
  assert.equal(parseSpec("archify ratio=99999:5").ratio, null);
});
