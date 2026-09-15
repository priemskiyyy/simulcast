import type { RealtimeDiagnosticEvent } from "@priemskiyyy/simulcast";
import { assertUnreachable } from "src/utils/assertUnreachable";

export type RecordedEventKind =
  "ERROR" | "PUBLICATION" | "LIFECYCLE" | "RUNTIME";

export const getEventKind = (
  event: Pick<RealtimeDiagnosticEvent, "source" | "type">,
): RecordedEventKind => {
  if (event.type === "error") {
    return "ERROR";
  }

  if (event.source === "runtime") {
    return "RUNTIME";
  }

  if (event.source === "connection" || event.source === "channel") {
    return event.type === "publication" ? "PUBLICATION" : "LIFECYCLE";
  }

  return assertUnreachable(event.source);
};
