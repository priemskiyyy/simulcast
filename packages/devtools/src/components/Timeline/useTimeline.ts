import { createContext, useContext } from "solid-js";
import type { Accessor } from "solid-js";
import type { EventFilterControls } from "src/hooks/useEventFilters";
import type { DevtoolsState } from "src/utils/devtoolsState";
import type { RecordedEvent } from "src/utils/EventLog";

export type TimelineContextValue = {
  events: Accessor<RecordedEvent[]>;
  recording: Accessor<DevtoolsState["recording"]>;
  filters: EventFilterControls;
  onTogglePause: () => void;
  onCapturePayloadsChange: (enabled: boolean) => void;
  onClear: () => void;
};

export const TimelineContext = createContext<TimelineContextValue>();

export const useTimeline = () => {
  const timeline = useContext(TimelineContext);

  if (timeline === undefined) {
    throw new Error("Timeline parts must be rendered inside <Timeline>.");
  }

  return timeline;
};
