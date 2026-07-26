import {
  RefreshCw,
} from "lucide-react";

type Props = {
  refreshing: boolean;
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function RefreshButton({
  refreshing,
  onClick,
  label = "Refresh",
  className = "",
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      className={[
        "app-refresh-button",
        refreshing ? "is-refreshing" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={
        disabled || refreshing
      }
      aria-busy={refreshing}
    >
      <RefreshCw
        size={17}
        aria-hidden="true"
      />

      <span>
        {refreshing
          ? "Refreshing..."
          : label}
      </span>
    </button>
  );
}
