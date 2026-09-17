export { RealtimeProvider } from "src/components/RealtimeProvider";
export type { RealtimeProviderProps } from "src/components/RealtimeProvider";
export { useRealtimeClient } from "src/primitives/useRealtimeClient";
export type {
  Register,
  RegisteredClient,
  RegisteredNativeConnection,
  RegisteredNativeSubscription,
  RegisteredPublication,
} from "src/types/Register";

export { useChannel } from "src/primitives/useChannel";
export type { UseChannelOptions } from "src/primitives/useChannel";
export type { ChannelInput } from "src/types/ChannelInput";
export type { PublicationHandler } from "src/types/PublicationHandler";
export { useChannelDemand } from "src/primitives/useChannelDemand";
export { useChannelStatus } from "src/primitives/useChannelStatus";
export { useConnectionState } from "src/primitives/useConnectionState";
export { useNativeConnection } from "src/primitives/useNativeConnection";
export { useNativeChannel } from "src/primitives/useNativeChannel";

export { createChannelEventHooks } from "src/primitives/createChannelEventHooks";
export type {
  EventDefinition,
  DecodedEvent,
  ChannelEventConfiguration,
} from "@priemskiyyy/simulcast";
