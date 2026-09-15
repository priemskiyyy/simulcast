import type { Publication } from "../realtime/Envelope";
import { SIMULATION_PREFIX } from "../realtime/RealtimeSource";

/**
 * Publishes simulation traffic through `BroadcastChannel`, the same path the
 * simulation adapter listens on. Every tab on the origin sees the same events.
 */
export const createBroadcastPublisher = () => {
  const channels = new Map<string, BroadcastChannel>();

  const publish = ({ channel, envelope }: Publication) => {
    const existing = channels.get(channel);
    const target =
      existing ?? new BroadcastChannel(`${SIMULATION_PREFIX}${channel}`);

    if (existing === undefined) {
      channels.set(channel, target);
    }

    target.postMessage(envelope);
  };
  const close = () => {
    for (const channel of channels.values()) {
      channel.close();
    }

    channels.clear();
  };

  return { publish, close };
};
