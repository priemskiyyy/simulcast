import { decodeEnvelope } from "example-shared";
import { createChannelEventHooks } from "@priemskiyyy/simulcast-svelte";
import type { Events } from "src/realtime/Events";

export const { useChannelEvent } = createChannelEventHooks<Events>({
  decode: decodeEnvelope,
});
