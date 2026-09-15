import { CopyButton } from "src/components/Timeline/CopyButton";
import { formatEventTime } from "src/formatting/formatEventTime";
import type { RecordedEvent } from "src/utils/EventLog";

type EventRowProps = {
  event: RecordedEvent;
};

export const EventRow = (props: EventRowProps) => {
  const isoTimestamp = () => new Date(props.event.timestamp).toISOString();

  return (
    <details class="event" data-kind={props.event.kind}>
      <summary>
        <time dateTime={isoTimestamp()} title={isoTimestamp()}>
          {formatEventTime(props.event.timestamp)}
        </time>
        <span class="event-type">{props.event.type}</span>
        <span class="event-channel">{props.event.channel ?? "connection"}</span>
        <span class="event-summary" title={props.event.summary}>
          {props.event.summary}
        </span>
        <svg
          class="expand"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <path
            d="M2 3.5 5 6.5 8 3.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </summary>
      <div class="context">
        <pre>{props.event.context}</pre>
        <CopyButton text={props.event.context} />
      </div>
    </details>
  );
};
