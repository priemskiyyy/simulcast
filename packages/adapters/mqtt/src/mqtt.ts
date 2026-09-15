import { connect } from "mqtt";
import type {
  IClientSubscribeOptions,
  IPublishPacket,
  MqttClient,
  OnMessageCallback,
} from "mqtt";
import { createRealtimeAdapter } from "simulcast";
import type { AdapterSubscribeRequest, AdapterSubscription } from "simulcast";
import type { MqttAdapterOptions } from "src/types/MqttAdapterOptions";
import { matchesTopic } from "src/utils/matchesTopic";

// A suback grants QoS 128 for a rejected filter.
const REJECTED_QOS = 128;

const createSubscription = (
  client: MqttClient,
  { channel: filter, observer }: AdapterSubscribeRequest<IPublishPacket>,
  options: IClientSubscribeOptions,
): AdapterSubscription<MqttClient> => {
  let outcome: "pending" | "granted" | "rejected" = "pending";

  const handleMessage: OnMessageCallback = (topic, payload, packet) => {
    // MQTT permits publications before SUBACK, but a failed filter must stay silent.
    if (outcome === "rejected") {
      return;
    }

    if (!matchesTopic(filter, topic)) {
      return;
    }

    observer.publication({ data: payload, native: packet });
  };
  // mqtt.js resubscribes on its own after a reconnect and confirms nothing, so mirror the connection.
  const handleConnect = () => {
    if (outcome !== "granted") {
      return;
    }

    observer.state("subscribed");
  };
  // Unlike offline, close also fires when automatic reconnect is disabled.
  const handleClose = () => {
    if (outcome !== "granted") {
      return;
    }

    observer.state(
      client.options.reconnectPeriod === 0 ? "unsubscribed" : "subscribing",
    );
  };

  client.on("message", handleMessage);
  client.on("connect", handleConnect);
  client.on("close", handleClose);
  observer.state("subscribing");
  client.subscribe(filter, options, (error, grants = []) => {
    if (error !== null) {
      outcome = "rejected";
      observer.error({ error });
      observer.state("unsubscribed");
      return;
    }

    const rejected = grants.find((grant) => grant.qos === REJECTED_QOS);

    if (rejected !== undefined) {
      outcome = "rejected";
      observer.error({ error: rejected });
      observer.state("unsubscribed");
      return;
    }

    outcome = "granted";
    observer.state("subscribed");
  });

  return {
    native: client,
    dispose: () => {
      client.off("message", handleMessage);
      client.off("connect", handleConnect);
      client.off("close", handleClose);
      client.unsubscribe(filter);
    },
  };
};

/**
 * Describes an MQTT connection through mqtt.js. Nothing connects until the
 * client starts a session; every session gets a fresh `MqttClient`.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: mqtt({
 *     url: "wss://broker.example.com/mqtt",
 *     options: { username, password },
 *   }),
 * });
 * ```
 */
export const mqtt = ({
  url,
  options,
  getSubscribeOptions,
}: MqttAdapterOptions) =>
  createRealtimeAdapter<MqttClient, IPublishPacket, MqttClient>({
    name: "mqtt",
    connect: (observer) => {
      const client = connect(url, { ...options, manualConnect: true });
      const handleConnect = () => observer.state("connected");
      const handleRetry = () => observer.state("connecting");
      // mqtt.js retries after every close unless `reconnectPeriod` is 0.
      const handleClose = () =>
        observer.state(
          client.options.reconnectPeriod === 0 ? "disconnected" : "connecting",
        );
      const handleEnd = () => observer.state("disconnected");
      const handleError = (error: Error) => observer.error({ error });

      client.on("connect", handleConnect);
      client.on("reconnect", handleRetry);
      client.on("offline", handleRetry);
      client.on("close", handleClose);
      client.on("end", handleEnd);
      client.on("error", handleError);
      observer.state("connecting");
      client.connect();

      return {
        native: client,
        subscribe: (request) =>
          createSubscription(
            client,
            request,
            typeof getSubscribeOptions === "function"
              ? getSubscribeOptions(request.channel)
              : { qos: 0 },
          ),
        dispose: () => {
          client.off("connect", handleConnect);
          client.off("reconnect", handleRetry);
          client.off("offline", handleRetry);
          client.off("close", handleClose);
          client.off("end", handleEnd);
          client.off("error", handleError);
          // mqtt.js arms its retry timer after emitting offline. Let that callback
          // finish before end clears it: https://github.com/mqttjs/MQTT.js/blob/v5.15.2/src/lib/client.ts
          queueMicrotask(() => client.end(true));
        },
      };
    },
  });
