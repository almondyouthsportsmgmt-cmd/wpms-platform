type Props = {
  notice?: string;
  error?: string;
  lastUpdated?: Date | null;
  onDismissError?: () => void;
};

function formatTime(
  value: Date,
) {
  return value.toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}

export function RefreshFeedback({
  notice = "",
  error = "",
  lastUpdated = null,
  onDismissError,
}: Props) {
  return (
    <div className="refresh-feedback">
      {notice && (
        <div className="success-notice">
          {notice}
        </div>
      )}

      {error && (
        <div className="form-error refresh-error">
          <span>{error}</span>

          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss refresh error"
            >
              ×
            </button>
          )}
        </div>
      )}

      {lastUpdated && (
        <div className="last-updated">
          Last updated{" "}
          <strong>
            {formatTime(lastUpdated)}
          </strong>
        </div>
      )}
    </div>
  );
}
