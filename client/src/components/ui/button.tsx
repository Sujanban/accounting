import { Button as RadixButton } from "@radix-ui/themes";
import type { ComponentProps } from "react";

type RadixButtonProps = ComponentProps<typeof RadixButton>;
type ButtonVariant = "filled" | "outline" | "ghost";

type AppButtonProps = Omit<RadixButtonProps, "variant" | "color"> & {
  variant?: ButtonVariant;
};

const styles: Record<
  ButtonVariant,
  Pick<RadixButtonProps, "variant" | "color">
> = {
  filled: { variant: "solid", color: "teal" },
  outline: { variant: "outline", color: "gray" },
  ghost: { variant: "ghost", color: "gray" },
};

export function Button({
  variant = "filled",
  className,
  ...props
}: AppButtonProps) {
  const style = styles[variant];

  return (
    <RadixButton
      {...props}
      {...style}
      className={["app-button", `app-button-${variant}`, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
