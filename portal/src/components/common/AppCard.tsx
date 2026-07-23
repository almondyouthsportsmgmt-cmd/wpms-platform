import type { ReactNode } from "react";
export function AppCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}
