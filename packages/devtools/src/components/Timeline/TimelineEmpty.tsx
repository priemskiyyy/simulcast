import { useTimeline } from "src/components/Timeline/useTimeline";
import { assertUnreachable } from "src/utils/assertUnreachable";

type EmptyStateVariant = "NO_MATCHES" | "PAUSED" | "WAITING";

const getEmptyStateVariant = (
  isFiltered: boolean,
  isPaused: boolean,
): EmptyStateVariant => {
  if (isFiltered) {
    return "NO_MATCHES";
  }

  if (isPaused) {
    return "PAUSED";
  }

  return "WAITING";
};

/** Explains why no rows show: filters hide them, recording is paused, or nothing happened yet. */
export const TimelineEmpty = () => {
  const timeline = useTimeline();
  const variant = () =>
    getEmptyStateVariant(
      timeline.filters.isFiltered(),
      timeline.recording().isPaused,
    );

  return (
    <>
      {(() => {
        const current = variant();

        if (current === "NO_MATCHES") {
          return (
            <>
              <strong>No matching events</strong>
              <p>Try another search or show all channels and kinds.</p>
              <button type="button" onClick={() => timeline.filters.clear()}>
                Clear filters
              </button>
            </>
          );
        }

        if (current === "PAUSED") {
          return (
            <>
              <strong>Recording paused</strong>
              <p>
                Your application keeps running. Resume to capture new events.
              </p>
            </>
          );
        }

        if (current === "WAITING") {
          return (
            <>
              <strong>Waiting for events</strong>
              <p>
                Connection changes and publications appear here as your
                application runs.
              </p>
            </>
          );
        }

        return assertUnreachable(current);
      })()}
    </>
  );
};
