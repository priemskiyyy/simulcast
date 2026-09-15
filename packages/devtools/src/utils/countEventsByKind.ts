import type { RecordedEvent } from "src/utils/EventLog";
import type { RecordedEventKind } from "src/utils/getEventKind";

export const countEventsByKind = (events: RecordedEvent[]) => {
  const counts: Record<RecordedEventKind, number> = {
    PUBLICATION: 0,
    LIFECYCLE: 0,
    ERROR: 0,
    RUNTIME: 0,
  };

  for (const event of events) {
    counts[event.kind] += 1;
  }

  return counts;
};
