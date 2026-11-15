import { test } from "node:test";
import assert from "node:assert/strict";
import { load } from "./helpers.mjs";

const {badgeClass,badgeLabel}=await load("src/badges.ts");
test("legacy classifications and explicit semantic tones use existing tokens",()=>{
  assert.equal(badgeClass("beta"),"trial");
  assert.equal(badgeClass({label:"feature/contract",tone:"warning"}),"trial");
  assert.equal(badgeClass({label:"main",tone:"success"}),"new");
  assert.equal(badgeLabel({label:"feature/contract",tone:"warning"}),"feature/contract");
});
