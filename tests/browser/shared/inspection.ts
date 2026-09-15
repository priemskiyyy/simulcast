import { Centrifuge } from "centrifuge";
import type { Subscription, SubscriptionEvents } from "centrifuge";

const sockets = new Set<WebSocket>();
const clients = new Set<Centrifuge>();
const subscriptions = new Set<Subscription>();
const subscriptionEvents: Array<keyof SubscriptionEvents> = [
  "state",
  "error",
  "publication",
  "subscribed",
  "subscribing",
  "unsubscribed",
  "join",
  "leave",
];
const countSubscriptionListeners = (subscription: Subscription) =>
  subscriptionEvents.reduce(
    (total, event) => total + subscription.listeners(event).length,
    0,
  );
// The SDK installs its own error handler on every subscription; only listeners above that count are ours.
const sdkSubscriptionListeners = countSubscriptionListeners(
  new Centrifuge("ws://baseline").newSubscription("baseline"),
);

export class ObservedWebSocket extends WebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols);
    sockets.add(this);
    this.addEventListener("close", () => sockets.delete(this), { once: true });
  }
}

export const trackClient = (client: Centrifuge) => {
  clients.add(client);
};

/** Counts live sockets, clients, subscriptions, and listeners so tests can assert resources return to baseline. */
export const inspect = () => {
  for (const client of clients) {
    for (const subscription of Object.values(client.subscriptions())) {
      subscriptions.add(subscription);
    }
  }
  const active = [...clients].filter(
    (client) => client.state !== "disconnected",
  );

  return JSON.stringify({
    sockets: sockets.size,
    clients: active.length,
    subscriptions: [...clients].reduce(
      (total, client) => total + Object.keys(client.subscriptions()).length,
      0,
    ),
    publicationListeners: [...subscriptions].reduce(
      (total, subscription) =>
        total + subscription.listeners("publication").length,
      0,
    ),
    releasedClientListeners: [...clients]
      .filter((client) => !active.includes(client))
      .map(
        (client) =>
          client.listeners("state").length +
          client.listeners("disconnected").length,
      ),
    releasedSubscriptionListeners: [...subscriptions]
      .filter((subscription) => subscription.state === "unsubscribed")
      .map(
        (subscription) =>
          countSubscriptionListeners(subscription) - sdkSubscriptionListeners,
      ),
  });
};
