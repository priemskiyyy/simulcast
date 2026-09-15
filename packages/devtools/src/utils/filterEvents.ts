import type { RecordedEvent } from "src/utils/EventLog";
import type { RecordedEventKind } from "src/utils/getEventKind";

export type EventFilters = {
  channel: string | null;
  query: string;
  kind: RecordedEventKind | null;
};

export const filterEvents = (
  events: RecordedEvent[],
  filters: EventFilters,
) => {
  const query = filters.query.trim().toLowerCase();

  return events.filter((event) => {
    if (filters.kind !== null && event.kind !== filters.kind) {
      return false;
    }

    // Connection events stay visible for a selected channel. A disconnect is usually why a subscription is stuck.
    const isOtherChannel =
      filters.channel !== null &&
      event.channel !== null &&
      event.channel !== filters.channel;

    if (isOtherChannel) {
      return false;
    }

    return `${event.type} ${event.channel ?? "connection"} ${event.summary} ${event.context}`
      .toLowerCase()
      .includes(query);
  });
};
