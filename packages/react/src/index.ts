export { RealtimeProvider } from "src/context/RealtimeProvider";
export type { RealtimeProviderProps } from "src/context/RealtimeProvider";
export { useRealtimeClient } from "src/hooks/useRealtimeClient";
export type {
  Register,
  RegisteredClient,
  RegisteredNativeConnection,
  RegisteredPublication,
} from "src/types/Register";

export { useChannel } from "src/hooks/useChannel";
export type { UseChannelOptions } from "src/hooks/useChannel";
export type { ChannelInput } from "src/types/ChannelInput";
export type { PublicationHandler } from "src/types/PublicationHandler";
export { useChannelStatus } from "src/hooks/useChannelStatus";
export { useConnectionState } from "src/hooks/useConnectionState";
export { useNativeConnection } from "src/hooks/useNativeConnection";

export { createChannelEventHooks } from "src/hooks/createChannelEventHooks";
export type {
  EventDefinition,
  DecodedEvent,
  ChannelEventConfiguration,
} from "@priemskiyyy/simulcast";
