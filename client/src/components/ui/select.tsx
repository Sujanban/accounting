import type { ComponentProps } from "react";

type AppSelectProps = ComponentProps<"select">;

export function AppSelect({ className, ...props }: AppSelectProps) {
  return (
    <select
      {...props}
      className={["app-select", className].filter(Boolean).join(" ")}
    />
  );
}
