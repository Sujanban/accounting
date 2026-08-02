export type CreateVoucherAction = {
  ariaShortcut: string;
  label: string;
  to: string;
  shortcut: string;
  shortcutCode: string;
};

export const createVoucherActions: CreateVoucherAction[] = [
  {
    ariaShortcut: "Alt+1",
    label: "Sales voucher",
    to: "/vouchers/sales/new",
    shortcut: "⌥1",
    shortcutCode: "Digit1",
  },
  {
    ariaShortcut: "Alt+2",
    label: "Purchase voucher",
    to: "/vouchers/purchase/new",
    shortcut: "⌥2",
    shortcutCode: "Digit2",
  },
  {
    ariaShortcut: "Alt+3",
    label: "Receipt voucher",
    to: "/vouchers/receipt/new",
    shortcut: "⌥3",
    shortcutCode: "Digit3",
  },
  {
    ariaShortcut: "Alt+4",
    label: "Payment voucher",
    to: "/vouchers/payment/new",
    shortcut: "⌥4",
    shortcutCode: "Digit4",
  },
  {
    ariaShortcut: "Alt+5",
    label: "Journal voucher",
    to: "/vouchers/journal/new",
    shortcut: "⌥5",
    shortcutCode: "Digit5",
  },
];

type ShortcutEvent = Pick<
  KeyboardEvent,
  "altKey" | "code" | "ctrlKey" | "metaKey" | "repeat" | "shiftKey"
>;

export function findCreateVoucherShortcut(
  event: ShortcutEvent,
): CreateVoucherAction | undefined {
  if (
    !event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.repeat
  ) {
    return undefined;
  }

  return createVoucherActions.find(
    (action) => action.shortcutCode === event.code,
  );
}

export function createVoucherShortcutLabel(
  shortcut: string,
  platform: string,
): string {
  const isAppleDevice = /Mac|iPhone|iPad|iPod/i.test(platform);
  return isAppleDevice ? shortcut : shortcut.replace("⌥", "Alt+");
}

export function createVoucherShortcutHint(platform: string): string {
  const isAppleDevice = /Mac|iPhone|iPad|iPod/i.test(platform);
  return isAppleDevice ? "Use ⌥ + 1–5" : "Use Alt + 1–5";
}
