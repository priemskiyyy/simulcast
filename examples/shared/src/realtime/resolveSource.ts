import { match } from "ts-pattern";
import type { RealtimeSource } from "./RealtimeSource";

/** The endpoint survives switching sources, so applications keep both and resolve the selected one. */
export const resolveSource = ({
  sourceType,
  endpoint,
}: {
  sourceType: RealtimeSource["type"];
  endpoint: string;
}): RealtimeSource =>
  match(sourceType)
    .with("SIMULATION", (): RealtimeSource => ({ type: "SIMULATION" }))
    .with("CENTRIFUGO", (): RealtimeSource => ({
      type: "CENTRIFUGO",
      endpoint,
    }))
    .exhaustive();
