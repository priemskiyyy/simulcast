import { RealtimeClient } from "@priemskiyyy/simulcast";
import { centrifugo } from "@priemskiyyy/simulcast-centrifugo";
import { ObservedWebSocket, trackClient } from "./inspection";

const parameters = new URLSearchParams(location.search);
const refresh = parameters.has("refresh");
const invalid = parameters.has("invalid");

const token = async (
  kind: "connection" | "subscription",
  user: string,
  channel?: string,
) => {
  const response = await fetch(`/test-api/${kind}-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, channel, refresh, invalid }),
  });
  if (!response.ok) throw new Error("Test token request failed");
  const body: { token: string } = await response.json();
  return body.token;
};

// The adapter captures its credentials, so each account gets its own client.
export const createClient = (user: string) => {
  const client = new RealtimeClient({
    adapter: centrifugo({
      transport: `ws://${location.host}/connection/websocket`,
      options: {
        websocket: ObservedWebSocket,
        getToken: () => token("connection", user),
        minReconnectDelay: 2_000,
        maxReconnectDelay: 2_000,
      },
      getSubscriptionOptions: (channel) => ({
        getToken: () => token("subscription", user, channel),
      }),
    }),
  });

  client.native.subscribe(() => {
    const native = client.native.get();

    if (native === null) {
      return;
    }

    trackClient(native);
  });

  return client;
};
