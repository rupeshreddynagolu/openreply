/**
 * asStringArray — Unit Tests
 */

import { describe, it, expect } from "vitest";
import { asStringArray } from "../lib/utils/json-array";

describe("asStringArray", () => {
  it("returns the array unchanged when every element is a string", () => {
    expect(asStringArray(["LINK", "SHOP"])).toEqual(["LINK", "SHOP"]);
  });

  it("returns an empty array for null", () => {
    expect(asStringArray(null)).toEqual([]);
  });

  it("returns an empty array for undefined", () => {
    expect(asStringArray(undefined)).toEqual([]);
  });

  it("returns an empty array for a non-array JSON value", () => {
    expect(asStringArray("LINK")).toEqual([]);
    expect(asStringArray(42)).toEqual([]);
    expect(asStringArray({ a: 1 })).toEqual([]);
  });

  it("filters out non-string elements from a mixed array", () => {
    expect(asStringArray(["LINK", 1, null, "SHOP"])).toEqual(["LINK", "SHOP"]);
  });

  it("returns an empty array for an empty array", () => {
    expect(asStringArray([])).toEqual([]);
  });
});
