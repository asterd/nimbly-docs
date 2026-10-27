import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { normalizeManifest } = await load("src/manifest.ts");
const base = { version: "1.0", title: "T", sections: [{ id: "s", title: "S", pages: [{ id: "p", title: "P", source: "p.md" }] }] };
const url = "https://docs.example.com/index.json";

test("versions resolve relative to the root manifest", () => {
  const m = normalizeManifest({ ...base, versions: [
    { id: "2.x", label: "v2", status: "current" },
    { id: "1.x", manifest: "./versions/1.x/index.json", status: "legacy" },
  ] }, url);
  assert.equal(m.versions.length, 2);
  assert.equal(m.versions[0].isDefault, true);
  assert.equal(m.versions[1].manifestUrl, "https://docs.example.com/versions/1.x/index.json");
  assert.equal(m.versions[1].label, "1.x");
});

test("versions require exactly one default entry", () => {
  assert.throws(() => normalizeManifest({ ...base, versions: [{ id: "a", manifest: "a.json" }] }, url), /exactly one/);
});

test("version ids and manifest URLs are validated", () => {
  assert.throws(() => normalizeManifest({ ...base, versions: [{ id: "../x" }] }, url), /invalid/);
  assert.throws(() => normalizeManifest({ ...base, versions: [{ id: "a" }, { id: "b", manifest: "javascript:alert(1)" }] }, url), /not allowed/);
});

test("unversioned manifests expose an empty list", () => {
  assert.deepEqual(normalizeManifest(base, url).versions, []);
});
