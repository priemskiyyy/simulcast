import { DEFAULT_ENDPOINT } from "../realtime/RealtimeSource";
import type { RealtimeSource } from "../realtime/RealtimeSource";
import { match } from "ts-pattern";

export type ApplicationState = {
  sourceType: RealtimeSource["type"];
  endpoint: string;
  roomId: string;
  enabled: boolean;
};

export type ApplicationAction =
  | { type: "SOURCE_SELECTED"; sourceType: RealtimeSource["type"] }
  | { type: "ENDPOINT_CHANGED"; endpoint: string }
  | { type: "ROOM_CHANGED"; roomId: string }
  | { type: "SESSION_TOGGLED" };

export const initialApplicationState: ApplicationState = {
  sourceType: "SIMULATION",
  endpoint: DEFAULT_ENDPOINT,
  roomId: "demo",
  enabled: true,
};

export const applicationReducer = (
  state: ApplicationState,
  action: ApplicationAction,
): ApplicationState =>
  match(action)
    .with({ type: "SOURCE_SELECTED" }, ({ sourceType }) => ({
      ...state,
      sourceType,
    }))
    .with({ type: "ENDPOINT_CHANGED" }, ({ endpoint }) => ({
      ...state,
      endpoint,
    }))
    .with({ type: "ROOM_CHANGED" }, ({ roomId }) => ({ ...state, roomId }))
    .with({ type: "SESSION_TOGGLED" }, () => ({
      ...state,
      enabled: !state.enabled,
    }))
    .exhaustive();
