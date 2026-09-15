import { For, Show } from "solid-js";
import type { JSX } from "solid-js";
import { EventRow } from "src/components/Timeline/EventRow";
import { useTimeline } from "src/components/Timeline/useTimeline";

type TimelineRowsProps = {
  emptyState: JSX.Element;
};

/** The visible events, newest first, or the empty state when nothing matches. */
export const TimelineRows = (props: TimelineRowsProps) => {
  const timeline = useTimeline();

  return (
    <Show
      when={timeline.filters.visibleEvents().length > 0}
      fallback={<div class="empty">{props.emptyState}</div>}
    >
      <div class="events" aria-label="Event timeline">
        <For each={timeline.filters.visibleEvents()}>
          {(event) => <EventRow event={event} />}
        </For>
      </div>
    </Show>
  );
};
