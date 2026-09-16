export { RealtimeProvider } from "src/components/RealtimeProvider";
export type { RealtimeProviderProps } from "src/components/RealtimeProvider";
export { useRealtimeClient } from "src/composables/useRealtimeClient";
export type {
  Register,
  RegisteredClient,
  RegisteredNativeConnection,
  RegisteredPublication,
} from "src/types/Register";

export { useChannel } from "src/composables/useChannel";
export type { UseChannelOptions } from "src/composables/useChannel";
export type { ChannelInput } from "src/types/ChannelInput";
export type { PublicationHandler } from "src/types/PublicationHandler";
export { useChannelStatus } from "src/composables/useChannelStatus";
export { useConnectionState } from "src/composables/useConnectionState";
export { useNativeConnection } from "src/composables/useNativeConnection";

export { createChannelEventHooks } from "src/composables/createChannelEventHooks";
export type {
  EventDefinition,
  DecodedEvent,
  ChannelEventConfiguration,
} from "@priemskiyyy/simulcast";
