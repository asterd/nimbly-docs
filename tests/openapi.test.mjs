import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const { parseApiSpec, renderApi } = await load("src/openapi.ts");
const { stringsFor } = await load("src/i18n.ts");
const s = stringsFor("en");

const v3 = `openapi: 3.0.3
info:
  title: Pets <script>
  version: 1.0.0
  description: |
    ## Intro
    Hello **world**.
servers:
  - url: https://api.example.com/v1
tags:
  - name: pets
    description: Everything about pets
paths:
  /pets/{petId}:
    parameters:
      - name: petId
        in: path
        required: true
        schema: { type: string, format: uuid }
    get:
      tags: [pets]
      operationId: getPet
      summary: Find a pet
      responses:
        '200':
          description: The pet
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Pet' }
        '404':
          description: Not found
  /health:
    get:
      summary: Health
      responses: { '204': { description: Up } }
components:
  securitySchemes:
    bearer: { type: http, scheme: bearer }
  schemas:
    Pet:
      type: object
      required: [name]
      properties:
        id: { type: string, readOnly: true }
        name: { type: string, example: Rex }
        status: { type: string, enum: [available, sold] }
        parent: { $ref: '#/components/schemas/Pet' }
        tags: { type: array, items: { type: string } }
`;

test("renders operations grouped by tag with escaped spec text and lazy bodies", () => {
  const api = renderApi(parseApiSpec(v3), s);
  const html = api.doc.html;
  assert.match(html, /<h1 id="pets-script">.*Pets &lt;script&gt;<\/h1>/);
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /<span class="nd-api-chip">v1.0.0<\/span><span class="nd-api-chip">OpenAPI 3.0.3<\/span>/);
  assert.match(html, /<details class="nd-api-op nd-api-m-get" id="op-getpet">/);
  assert.match(html, /\/pets\/<span class="nd-api-pp">\{petId\}<\/span>/);
  assert.match(html, /<h2 id="tag-endpoints">/, "untagged operations get a default group");
  assert.match(html, /id="schema-pet"/);
  assert.match(html, /<div class="nd-api-toolbar"><\/div>/);
  assert.deepEqual(api.doc.toc.map((t) => t.text), ["Intro", "Authentication", "pets", "Find a pet", "Endpoints", "Health", "Schemas"]);
  assert.match(api.search.get("op-getpet"), /get \/pets\/\{petid\} find a pet getpet/);
  // Bodies are not rendered up front.
  assert.doesNotMatch(html, /petId<\/code>|Rex/);
  const body = api.bodies.get("op-getpet")();
  assert.match(body, /<code class="nd-api-name">petId<\/code>.*<span class="nd-api-in">path<\/span><span class="nd-api-required">required<\/span>/);
  assert.match(body, /<a href="#schema-pet">Pet<\/a>/);
  assert.match(body, /↻ recursive/, "self references stop");
  assert.match(body, /data-sync="nd-api-view"/);
  assert.match(body, /<div class="nd-api-response"><span class="nd-api-status nd-api-s4">404<\/span>/);
  // Generated example: example values, enum first value, readOnly kept in responses.
  assert.match(body, /&quot;name&quot;/);
  assert.match(body, /Rex/);
  assert.match(body, /available/);
});

test("Swagger 2.0 bodies, form data and responses map to OpenAPI 3 shapes", () => {
  const spec = parseApiSpec(JSON.stringify({
    swagger: "2.0", info: { title: "Old", version: "2" }, host: "api.test", basePath: "/v2", schemes: ["https"],
    paths: { "/pets": { post: { operationId: "addPet", consumes: ["application/json"], parameters: [
      { in: "body", name: "body", required: true, schema: { $ref: "#/definitions/Pet" } },
      { in: "query", name: "dry", type: "boolean" },
    ], responses: { 200: { description: "ok", schema: { type: "array", items: { $ref: "#/definitions/Pet" } } } } },
    put: { consumes: ["multipart/form-data"], parameters: [{ in: "formData", name: "file", type: "file", required: true }], responses: {} } } },
    definitions: { Pet: { type: "object", properties: { name: { type: "string" } } } },
  }));
  const api = renderApi(spec, s);
  assert.match(api.doc.html, /<code>https:\/\/api.test\/v2<\/code>/);
  assert.match(api.doc.html, /Swagger 2.0/);
  const post = api.bodies.get("op-addpet")();
  assert.match(post, /Request body <span class="nd-api-required">required<\/span>/);
  assert.match(post, /<code class="nd-api-name">dry<\/code><span class="nd-api-type">boolean<\/span>/);
  assert.doesNotMatch(post, /<code class="nd-api-name">body<\/code>/);
  assert.match(post, /array&lt;<a href="#schema-pet">Pet<\/a>&gt;/);
  const put = [...api.bodies.entries()].find(([id]) => id.startsWith("op-put"))[1]();
  assert.match(put, /multipart\/form-data/);
  assert.match(put, /<code class="nd-api-name">file<\/code>/);
});

test("rejects documents that are not OpenAPI or Swagger", () => {
  assert.throws(() => parseApiSpec("title: nope"), /not an OpenAPI/);
  assert.throws(() => parseApiSpec("{ broken"), /could not be parsed/);
  assert.equal(parseApiSpec('{"openapi":"3.1.0","info":{"title":"x","version":"1"}}').openapi, "3.1.0");
});
