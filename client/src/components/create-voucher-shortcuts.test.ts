import { describe, expect, it } from "vitest";
import {
  createVoucherShortcutHint,
  createVoucherShortcutLabel,
  findCreateVoucherShortcut,
} from "./create-voucher-shortcuts";

function shortcutEvent(overrides: Record<string, boolean | string> = {}) {
  return {
    altKey: true,
    code: "Digit1",
    ctrlKey: false,
    metaKey: false,
    repeat: false,
    shiftKey: false,
    ...overrides,
  };
}

describe("findCreateVoucherShortcut", () => {
  it("maps Alt plus a menu number to the corresponding voucher", () => {
    expect(findCreateVoucherShortcut(shortcutEvent())?.label).toBe(
      "Sales voucher",
    );
    expect(
      findCreateVoucherShortcut(shortcutEvent({ code: "Digit5" }))?.label,
    ).toBe("Journal voucher");
  });

  it("ignores incomplete, modified, repeated, and unknown shortcuts", () => {
    expect(findCreateVoucherShortcut(shortcutEvent({ altKey: false }))).toBeUndefined();
    expect(findCreateVoucherShortcut(shortcutEvent({ ctrlKey: true }))).toBeUndefined();
    expect(findCreateVoucherShortcut(shortcutEvent({ repeat: true }))).toBeUndefined();
    expect(findCreateVoucherShortcut(shortcutEvent({ code: "Digit6" }))).toBeUndefined();
  });
});

describe("createVoucherShortcutLabel", () => {
  it("uses the Option symbol on Apple devices", () => {
    expect(createVoucherShortcutLabel("⌥1", "MacIntel")).toBe("⌥1");
    expect(createVoucherShortcutLabel("⌥2", "iPhone")).toBe("⌥2");
  });

  it("uses Alt on Windows and Linux", () => {
    expect(createVoucherShortcutLabel("⌥1", "Win32")).toBe("Alt+1");
    expect(createVoucherShortcutLabel("⌥2", "Linux x86_64")).toBe("Alt+2");
  });
});

describe("createVoucherShortcutHint", () => {
  it("explains the platform-specific shortcut range", () => {
    expect(createVoucherShortcutHint("MacIntel")).toBe("Use ⌥ + 1–5");
    expect(createVoucherShortcutHint("Win32")).toBe("Use Alt + 1–5");
  });
});
