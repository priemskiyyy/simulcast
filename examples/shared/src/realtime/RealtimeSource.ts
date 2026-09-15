/** Where publications come from: the in-page simulation or a Centrifugo server. */
export type RealtimeSource =
  { type: "SIMULATION" } | { type: "CENTRIFUGO"; endpoint: string };

export const DEFAULT_ENDPOINT = "ws://localhost:8000/connection/websocket";
export const SIMULATION_PREFIX = "mission-control:";
