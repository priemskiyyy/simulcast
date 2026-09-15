import type { PusherConnectionState } from "src/types/PusherConnectionState";
import { CONNECTION_STATES } from "src/utils/constants/connectionStates";

export const isPusherConnectionState = (
  state: string,
): state is PusherConnectionState => state in CONNECTION_STATES;
