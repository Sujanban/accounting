import { Button as RadixButton } from "@radix-ui/themes";
import type { ComponentProps } from "react";

type RadixButtonProps = ComponentProps<typeof RadixButton>;
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-outline";

type AppButtonProps = Omit<RadixButtonProps, "variant" | "color"> & {
  variant?: ButtonVariant;
};

const styles: Record<ButtonVariant, Pick<RadixButtonProps, "variant" | "color">> = {
  primary: { variant: "solid", color: "indigo" },
  secondary: { variant: "soft", color: "indigo" },
  outline: { variant: "outline", color: "gray" },
  ghost: { variant: "ghost", color: "gray" },
  danger: { variant: "solid", color: "red" },
  "danger-outline": { variant: "soft", color: "red" },
};

export function Button({ variant = "primary", className, ...props }: AppButtonProps) {
  const style = styles[variant];

  return <RadixButton {...props} {...style} className={["app-button", `app-button-${variant}`, className].filter(Boolean).join(" ")} />;
}
