import { For, createMemo } from "solid-js";
import { useTimeline } from "src/components/Timeline/useTimeline";
import { formatEventKind } from "src/formatting/formatEventKind";
import { countEventsByKind } from "src/utils/countEventsByKind";
import type { RecordedEventKind } from "src/utils/getEventKind";

const KINDS: RecordedEventKind[] = [
  "PUBLICATION",
  "LIFECYCLE",
  "ERROR",
  "RUNTIME",
];

/** Kind chips with live counts; one kind at a time narrows the rows. */
export const TimelineKinds = () => {
  const timeline = useTimeline();
  const counts = createMemo(() => countEventsByKind(timeline.events()));
  const selected = () => timeline.filters.filters().kind;

  return (
    <div class="kinds" role="group" aria-label="Event kinds">
      <button
        type="button"
        class="chip"
        aria-pressed={selected() === null}
        onClick={() => timeline.filters.update({ kind: null })}
      >
        All <span class="count">{timeline.events().length}</span>
      </button>
      <For each={KINDS}>
        {(kind) => (
          <button
            type="button"
            class="chip"
            data-kind={kind}
            aria-pressed={selected() === kind}
            onClick={() => timeline.filters.update({ kind })}
          >
            {formatEventKind(kind)} <span class="count">{counts()[kind]}</span>
          </button>
        )}
      </For>
    </div>
  );
};
