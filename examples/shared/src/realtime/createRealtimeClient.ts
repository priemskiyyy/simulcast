import { RealtimeClient } from "@priemskiyyy/simulcast";
import { broadcastChannel } from "@priemskiyyy/simulcast-broadcast-channel";
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";
import { match } from "ts-pattern";
import { SIMULATION_PREFIX } from "./RealtimeSource";
import type { RealtimeSource } from "./RealtimeSource";

/** One client per source. The adapter captures its endpoint, so a new source means a new client. */
export const createRealtimeClient = (source: RealtimeSource) =>
  match(source)
    .with(
      { type: "SIMULATION" },
      () =>
        new RealtimeClient({
          adapter: broadcastChannel({ prefix: SIMULATION_PREFIX }),
        }),
    )
    .with(
      { type: "CENTRIFUGO" },
      ({ endpoint }) =>
        new RealtimeClient({ adapter: centrifugo({ transport: endpoint }) }),
    )
    .exhaustive();
