import {
  useCallback,
  useState,
} from "react";

type RefreshAction =
  () => Promise<void> | void;

type Options = {
  successMessage?: string;
  errorMessage?: string;
};

export function useRefreshController(
  action: RefreshAction,
  options: Options = {},
) {
  const [refreshing, setRefreshing] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [notice, setNotice] =
    useState("");

  const [error, setError] =
    useState("");

  const refresh = useCallback(
    async () => {
      if (refreshing) {
        return;
      }

      setRefreshing(true);
      setNotice("");
      setError("");

      try {
        await action();

        setLastUpdated(new Date());

        setNotice(
          options.successMessage ??
            "Data refreshed successfully.",
        );

        window.setTimeout(
          () => setNotice(""),
          2400,
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : options.errorMessage ??
              "Unable to refresh data.",
        );
      } finally {
        setRefreshing(false);
      }
    },
    [
      action,
      options.errorMessage,
      options.successMessage,
      refreshing,
    ],
  );

  return {
    refreshing,
    lastUpdated,
    notice,
    error,
    refresh,
    clearError() {
      setError("");
    },
    clearNotice() {
      setNotice("");
    },
  };
}
