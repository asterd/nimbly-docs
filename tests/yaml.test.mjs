import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { parseYaml } = await load("src/yaml.ts");

test("block mappings, sequences and core-schema scalars", () => {
  const doc = parseYaml(`
# comment
openapi: 3.0.3
info:
  title: Orders API   # trailing comment
  version: "1.2"
  x-flag: true
  x-none: ~
  x-num: 42
  x-float: 1.5e3
tags:
- name: orders
- name: "quoted: value"
  description: 'It''s here'
`);
  assert.deepEqual(doc, {
    openapi: "3.0.3",
    info: { title: "Orders API", version: "1.2", "x-flag": true, "x-none": null, "x-num": 42, "x-float": 1500 },
    tags: [{ name: "orders" }, { name: "quoted: value", description: "It's here" }],
  });
});

test("paths with braces and colons, numeric status keys", () => {
  const doc = parseYaml(`paths:
  /orders/{id}:
    get:
      responses:
        '200':
          description: OK
        404:
          description: Missing
  /v1/items:batchGet:
    post: {}
`);
  assert.deepEqual(Object.keys(doc.paths), ["/orders/{id}", "/v1/items:batchGet"]);
  assert.equal(doc.paths["/orders/{id}"].get.responses["200"].description, "OK");
  assert.equal(doc.paths["/orders/{id}"].get.responses["404"].description, "Missing");
  assert.deepEqual(doc.paths["/v1/items:batchGet"].post, {});
});

test("literal and folded block scalars with chomping", () => {
  const doc = parseYaml(`a: |
  line 1
    indented
  line 3

b: >-
  folded
  text

  new paragraph
c: |+
  keep

d: plain
  continued
`);
  assert.equal(doc.a, "line 1\n  indented\nline 3\n");
  assert.equal(doc.b, "folded text\nnew paragraph");
  assert.equal(doc.c, "keep\n\n");
  assert.equal(doc.d, "plain continued");
});

test("flow collections, including multi-line ones", () => {
  const doc = parseYaml(`enum: [asc, desc]
obj: {type: string, format: uri, example: "https://x.test/a?b=1"}
multi: [
  one,
  two, {k: v}
]
empty: []
url: {u: http://example.com:8080/x}
`);
  assert.deepEqual(doc.enum, ["asc", "desc"]);
  assert.deepEqual(doc.obj, { type: "string", format: "uri", example: "https://x.test/a?b=1" });
  assert.deepEqual(doc.multi, ["one", "two", { k: "v" }]);
  assert.deepEqual(doc.empty, []);
  assert.equal(doc.url.u, "http://example.com:8080/x");
});

test("anchors, aliases and merge keys share data without copying", () => {
  const doc = parseYaml(`base: &base
  type: object
  required: [id]
pet:
  <<: *base
  title: Pet
list:
  - *base
`);
  assert.equal(doc.pet.type, "object");
  assert.equal(doc.pet.title, "Pet");
  assert.equal(doc.list[0], doc.base);
});

test("nested sequences of mappings and sequences", () => {
  const doc = parseYaml(`parameters:
  - name: id
    in: path
    schema:
      type: string
  -
    name: q
    in: query
matrix:
  - - 1
    - 2
  - - 3
`);
  assert.deepEqual(doc.parameters, [{ name: "id", in: "path", schema: { type: "string" } }, { name: "q", in: "query" }]);
  assert.deepEqual(doc.matrix, [[1, 2], [3]]);
});

test("double-quoted escapes and multi-line quoted scalars", () => {
  const doc = parseYaml(`a: "tab\\there \\u00e8 \\"q\\""
b: "first
  second"
c: 'hash # inside'
`);
  assert.equal(doc.a, 'tab\there è "q"');
  assert.equal(doc.b, "first second");
  assert.equal(doc.c, "hash # inside");
});

test("__proto__ keys never alter prototypes", () => {
  const doc = parseYaml(`__proto__:\n  polluted: true\n`);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.getPrototypeOf(doc), Object.prototype);
  assert.deepEqual(doc.__proto__, { polluted: true });
});

test("document markers and errors", () => {
  assert.deepEqual(parseYaml("---\na: 1\n...\n"), { a: 1 });
  assert.throws(() => parseYaml("a: *missing"), /unknown alias/);
  assert.throws(() => parseYaml("a:\n  b: 1\n c: 2"), /YAML line 3/);
});

test("more-indented lines continue a plain scalar even when they look structural", () => {
  const doc = parseYaml("d: The file name\n  - for example, `x.md`\n  key: like text\nn: 1");
  assert.equal(doc.d, "The file name - for example, `x.md` key: like text");
  assert.equal(doc.n, 1);
});

test("escaped whitespace survives quoted line folding", () => {
  assert.equal(parseYaml('a: "x\\t\n   y"').a, "x\t y");
});
