// Purpose: shared button with consistent loading spinner behavior.
// Constraints: presentational only; callers own click handlers and API calls.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "secondary";
  children: ReactNode;
};

export function Button({
  loading = false,
  variant = "primary",
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = ["button", variant === "secondary" ? "secondary" : "", loading ? "is-loading" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} type={type} {...props}>
      {loading ? <Spinner /> : null}
      <span>{children}</span>
    </button>
  );
}
