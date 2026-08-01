import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { DropdownMenu } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

export type OrderMenuAction = {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export function OrderActionsMenu({ label, actions }: { label: string; actions: OrderMenuAction[] }) {
  if (!actions.length) return <span className="order-actions__empty">No actions</span>;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button size="1" variant="ghost" className="table-icon-button order-actions__trigger" aria-label={label}>
          <DotsHorizontalIcon className="table-action-icon" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="order-actions__menu">
        {actions.map((action) => (
          <DropdownMenu.Item
            key={action.label}
            color={action.destructive ? "red" : undefined}
            disabled={action.disabled}
            onSelect={action.onSelect}
          >
            {action.icon}
            {action.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
