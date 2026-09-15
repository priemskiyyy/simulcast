import type { DecodedEvent } from "src/types/DecodedEvent";
import type { RealtimePublication } from "src/types/RealtimePublication";

// Pusher, Ably, Supabase, Socket.IO, and Phoenix name their events; Centrifugo and MQTT need an envelope.
export const decodeProviderEvent = ({
  event,
  data,
}: RealtimePublication): DecodedEvent | null => {
  if (event === undefined) {
    return null;
  }

  return { eventType: event, payload: data };
};
