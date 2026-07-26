import {
  RefreshButton,
} from "./RefreshButton";
import {
  RefreshFeedback,
} from "./RefreshFeedback";
import {
  RefreshableContent,
} from "./RefreshableContent";
import {
  useRefreshController,
} from "./useRefreshController";

export function ExampleModule() {
  async function reloadModule() {
    // Replace this with the module's
    // existing refresh function.
  }

  const refreshController =
    useRefreshController(
      reloadModule,
    );

  return (
    <div>
      <RefreshButton
        refreshing={
          refreshController.refreshing
        }
        onClick={() =>
          void refreshController.refresh()
        }
      />

      <RefreshFeedback
        notice={
          refreshController.notice
        }
        error={
          refreshController.error
        }
        lastUpdated={
          refreshController.lastUpdated
        }
        onDismissError={
          refreshController.clearError
        }
      />

      <RefreshableContent
        refreshing={
          refreshController.refreshing
        }
      >
        Module content goes here.
      </RefreshableContent>
    </div>
  );
}
