import type { RecordedEventKind } from "src/utils/getEventKind";

export const formatEventKind = (kind: RecordedEventKind) => {
  const LABELS: Record<RecordedEventKind, string> = {
    PUBLICATION: "Publications",
    LIFECYCLE: "Lifecycle",
    ERROR: "Errors",
    RUNTIME: "Runtime",
  };

  return LABELS[kind];
};
