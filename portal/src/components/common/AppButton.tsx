import type { ButtonHTMLAttributes, ReactNode } from "react";
export function AppButton({ children, variant = "primary", className = "", ...props }:
ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; variant?: "primary"|"secondary"|"ghost" }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>;
}
