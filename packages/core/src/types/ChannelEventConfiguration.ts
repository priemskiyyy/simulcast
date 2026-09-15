import type { DecodedEvent } from "src/types/DecodedEvent";
import type { RealtimePublication } from "src/types/RealtimePublication";

export type ChannelEventConfiguration = {
  /**
   * Extracts the event name and payload, or returns null to ignore a publication.
   * Defaults to the provider's event name with the publication data as payload.
   */
  decode?: (publication: RealtimePublication) => DecodedEvent | null;
};
