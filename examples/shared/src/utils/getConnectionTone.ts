import type { ConnectionState } from "simulcast";
import { match } from "ts-pattern";
import type { Tone } from "./Tone";

export const getConnectionTone = (state: ConnectionState): Tone =>
  match(state)
    .with("connected", (): Tone => "positive")
    .with("connecting", (): Tone => "warning")
    .with("disconnected", (): Tone => "neutral")
    .exhaustive();
