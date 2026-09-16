import { RealtimeClient, createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type { AdapterSubscriptionObserver } from "@priemskiyyy/simulcast";
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";
import type { Publication, RealtimeSource } from "example-shared";
import { match } from "ts-pattern";

/** Native has no BroadcastChannel, so the local demo keeps active observers in memory. */
const createSimulationClient = () => {
  const channels = new Map<string, Set<AdapterSubscriptionObserver>>();
  const adapter = createRealtimeAdapter({
    name: "simulation",
    connect: (observer) => {
      observer.state("connected");
      return {
        native: null,
        subscribe: ({ channel, observer }) => {
          const observers =
            channels.get(channel) ?? new Set<AdapterSubscriptionObserver>();
          channels.set(channel, observers);
          observers.add(observer);
          observer.state("subscribed");
          return {
            native: null,
            dispose: () => {
              observers.delete(observer);
              if (observers.size === 0) {
                channels.delete(channel);
              }
            },
          };
        },
        dispose: () => {},
      };
    },
  });

  return {
    client: new RealtimeClient({ adapter }),
    publish: ({ channel, envelope }: Publication) => {
      for (const observer of [...(channels.get(channel) ?? [])]) {
        observer.publication({ data: envelope, native: null });
      }
    },
  };
};

/** One client per source. The adapter captures its endpoint, so a new source means a new client. */
export const createRealtimeClient = (source: RealtimeSource) =>
  match(source)
    .with({ type: "SIMULATION" }, createSimulationClient)
    .with({ type: "CENTRIFUGO" }, ({ endpoint }) => ({
      client: new RealtimeClient({
        adapter: centrifugo({ transport: endpoint }),
      }),
      publish: null,
    }))
    .exhaustive();
