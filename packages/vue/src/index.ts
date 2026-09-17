export { RealtimeProvider } from "src/components/RealtimeProvider";
export type { RealtimeProviderProps } from "src/components/RealtimeProvider";
export { useRealtimeClient } from "src/composables/useRealtimeClient";
export type {
  Register,
  RegisteredClient,
  RegisteredNativeConnection,
  RegisteredNativeSubscription,
  RegisteredPublication,
} from "src/types/Register";

export { useChannel } from "src/composables/useChannel";
export type { UseChannelOptions } from "src/composables/useChannel";
export type { ChannelInput } from "src/types/ChannelInput";
export type { PublicationHandler } from "src/types/PublicationHandler";
export { useChannelDemand } from "src/composables/useChannelDemand";
export { useChannelStatus } from "src/composables/useChannelStatus";
export { useConnectionState } from "src/composables/useConnectionState";
export { useNativeConnection } from "src/composables/useNativeConnection";
export { useNativeChannel } from "src/composables/useNativeChannel";

export { createChannelEventHooks } from "src/composables/createChannelEventHooks";
export type {
  EventDefinition,
  DecodedEvent,
  ChannelEventConfiguration,
} from "@priemskiyyy/simulcast";
