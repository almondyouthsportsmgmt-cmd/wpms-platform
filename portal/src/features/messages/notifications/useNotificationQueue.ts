import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  cancelNotification,
  getNotification,
  listNotificationQueue,
  markNotificationFailed,
  markNotificationSent,
  saveNotification,
  scheduleNotification,
} from "./notificationQueueService";

import type {
  NotificationQueueItem,
} from "./notificationTypes";

type DeliverNotification = (
  item: NotificationQueueItem,
) => Promise<void>;

export function useNotificationQueue(
  deliverNotification?: DeliverNotification,
) {
  const [items, setItems] = useState<
    NotificationQueueItem[]
  >([]);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] =
    useState<string | null>(null);

  const reload = useCallback(() => {
    setItems(listNotificationQueue());
  }, []);

  useEffect(() => {
    reload();

    function handleUpdate() {
      reload();
    }

    window.addEventListener(
      "wpms:reschedule-notice-queued",
      handleUpdate,
    );

    window.addEventListener(
      "wpms:notification-queue-updated",
      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        "wpms:reschedule-notice-queued",
        handleUpdate,
      );

      window.removeEventListener(
        "wpms:notification-queue-updated",
        handleUpdate,
      );
    };
  }, [reload]);

  async function run(
    id: string,
    action: () => Promise<unknown> | unknown,
  ) {
    setWorkingId(id);
    setError("");

    try {
      await action();
      reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update the notification.",
      );

      throw caught;
    } finally {
      setWorkingId(null);
    }
  }

  return {
    items,
    error,
    workingId,
    reload,

    update(item: NotificationQueueItem) {
      return run(item.id, () =>
        saveNotification(item),
      );
    },

    async send(id: string) {
      await run(id, async () => {
        const item = getNotification(id);

        if (!item) {
          throw new Error(
            "Notification could not be found.",
          );
        }

        if (!item.customerId) {
          throw new Error(
            "This notice is not connected to a customer record.",
          );
        }

        if (!deliverNotification) {
          throw new Error(
            "Message delivery is not connected.",
          );
        }

        try {
          await deliverNotification(item);
          markNotificationSent(id);
        } catch (caught) {
          markNotificationFailed(id);
          throw caught;
        }
      });
    },

    schedule(
      id: string,
      scheduledFor: string,
    ) {
      return run(id, () =>
        scheduleNotification(
          id,
          scheduledFor,
        ),
      );
    },

    cancel(id: string) {
      return run(id, () =>
        cancelNotification(id),
      );
    },
  };
}
