import type {
  ReactNode,
} from "react";

type Props = {
  refreshing: boolean;
  children: ReactNode;
  className?: string;
};

export function RefreshableContent({
  refreshing,
  children,
  className = "",
}: Props) {
  return (
    <div
      className={[
        "refreshable-content",
        refreshing
          ? "is-refreshing"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy={refreshing}
    >
      {children}
    </div>
  );
}
