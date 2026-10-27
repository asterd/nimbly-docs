import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { parseHash, buildHash, setRouteVersion } = await load("src/router.ts");

test("parses versioned and unversioned routes", () => {
  assert.deepEqual(parseHash("#/intro"), { pageId: "intro", anchor: null, version: null });
  assert.deepEqual(parseHash("#/@2.x/api/orders#list"), { pageId: "api/orders", anchor: "list", version: "2.x" });
  assert.deepEqual(parseHash("#/@2.x"), { pageId: null, anchor: null, version: "2.x" });
});

test("buildHash carries the active version unless overridden", () => {
  setRouteVersion("1.0");
  assert.equal(buildHash("intro"), "#/@1.0/intro");
  assert.equal(buildHash("intro", "a", null), "#/intro#a");
  setRouteVersion(null);
  assert.equal(buildHash("intro"), "#/intro");
});
