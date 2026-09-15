import { decodeEnvelope } from "example-shared";
import { createChannelEventHooks } from "@priemskiyyy/simulcast-solid";
import type { Events } from "src/realtime/Events";

export const { useChannelEvent } = createChannelEventHooks<Events>({
  decode: decodeEnvelope,
});
