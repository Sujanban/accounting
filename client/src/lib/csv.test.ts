import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("escapes commas, quotes, and line breaks", () => {
    expect(toCsv(["Name", "Amount"], [["A, Inc.", 100], ["Said \"hello\"\nnext", null]])).toBe('Name,Amount\r\n"A, Inc.",100\r\n"Said ""hello""\nnext",');
  });
});
