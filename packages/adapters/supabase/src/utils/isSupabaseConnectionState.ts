import type { SupabaseConnectionState } from "src/types/SupabaseConnectionState";
import { CONNECTION_STATES } from "src/utils/constants/connectionStates";

export const isSupabaseConnectionState = (
  state: string,
): state is SupabaseConnectionState => state in CONNECTION_STATES;
