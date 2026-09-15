import { useTimeline } from "src/components/Timeline/useTimeline";

/** Search, pause, clear, and payload capture for the recorded events. */
export const TimelineToolbar = () => {
  const timeline = useTimeline();

  return (
    <div class="toolbar">
      <input
        aria-label="Filter events"
        type="search"
        placeholder="Filter by type, channel, or payload…"
        value={timeline.filters.filters().query}
        onInput={(event) =>
          timeline.filters.update({ query: event.currentTarget.value })
        }
      />
      <button
        type="button"
        aria-pressed={timeline.recording().isPaused}
        onClick={() => timeline.onTogglePause()}
      >
        {timeline.recording().isPaused ? "Resume" : "Pause"}
      </button>
      <button type="button" onClick={() => timeline.onClear()}>
        Clear
      </button>
      <label class="capture">
        <input
          type="checkbox"
          checked={timeline.recording().capturePayloads}
          onChange={(event) =>
            timeline.onCapturePayloadsChange(event.currentTarget.checked)
          }
        />
        Capture payloads
      </label>
      <span class="total">
        {timeline.filters.visibleEvents().length} / {timeline.events().length}
      </span>
    </div>
  );
};
