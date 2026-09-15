import { createChannelEventHooks } from "../index.js";

type Events = { created: { channel: string; payload: unknown } };

export const { useChannelEvent } = createChannelEventHooks<Events>();
