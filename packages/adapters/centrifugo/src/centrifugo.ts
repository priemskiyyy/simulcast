import { Centrifuge } from "centrifuge";
import type {
  ClientEvents,
  PublicationContext,
  Subscription,
  SubscriptionEvents,
  SubscriptionOptions,
} from "centrifuge";
import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
} from "@priemskiyyy/simulcast";
import type { CentrifugoAdapterOptions } from "src/types/CentrifugoAdapterOptions";
import { CONNECTION_STATES } from "src/utils/constants/connectionStates";
import { SUBSCRIPTION_STATES } from "src/utils/constants/subscriptionStates";

const createSubscription = (
  client: Centrifuge,
  { channel, observer }: AdapterSubscribeRequest<PublicationContext>,
  options: SubscriptionOptions | undefined,
): AdapterSubscription<Subscription> => {
  const subscription = client.newSubscription(channel, options);
  const handleState: SubscriptionEvents["state"] = ({ newState }) =>
    observer.state(SUBSCRIPTION_STATES[newState]);
  const handlePublication: SubscriptionEvents["publication"] = (publication) =>
    observer.publication({ data: publication.data, native: publication });
  const handleError: SubscriptionEvents["error"] = (error) =>
    observer.error({ error });

  subscription.on("state", handleState);
  subscription.on("publication", handlePublication);
  subscription.on("error", handleError);

  const dispose = () => {
    subscription.off("state", handleState);
    subscription.off("publication", handlePublication);
    subscription.off("error", handleError);
    client.removeSubscription(subscription);
  };

  try {
    subscription.subscribe();
  } catch (error) {
    dispose();
    throw error;
  }

  return { native: subscription, dispose };
};

/**
 * Describes a Centrifugo connection. Nothing connects until the client starts
 * a session; every session gets a fresh `Centrifuge` instance.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: centrifugo({
 *     transport: "wss://example.com/connection/websocket",
 *     options: { getToken: () => fetchToken() },
 *   }),
 * });
 * ```
 */
export const centrifugo = ({
  transport,
  options,
  getSubscriptionOptions,
}: CentrifugoAdapterOptions) =>
  createRealtimeAdapter<Centrifuge, PublicationContext, Subscription>({
    name: "centrifugo",
    connect: (observer) => {
      const client = new Centrifuge(transport, options);
      const handleState: ClientEvents["state"] = ({ newState }) =>
        observer.state(CONNECTION_STATES[newState]);
      const handleError: ClientEvents["error"] = (error) =>
        observer.error({ error });

      client.on("state", handleState);
      client.on("error", handleError);

      const dispose = () => {
        client.off("state", handleState);
        client.off("error", handleError);
        client.disconnect();
      };

      try {
        client.connect();
      } catch (error) {
        dispose();
        throw error;
      }

      return {
        native: client,
        subscribe: (request) =>
          createSubscription(
            client,
            request,
            typeof getSubscriptionOptions === "function"
              ? getSubscriptionOptions(request.channel)
              : undefined,
          ),
        dispose,
      };
    },
  });
