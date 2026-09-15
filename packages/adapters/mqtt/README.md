# simulcast-mqtt

MQTT adapter for [simulcast](../../core), built on [mqtt.js](https://github.com/mqttjs/MQTT.js). Requires `mqtt` 5.

## Installation

```sh
pnpm add simulcast simulcast-mqtt mqtt
```

## Create a client

```ts
import { RealtimeClient } from "simulcast";
import { mqtt } from "simulcast-mqtt";

const realtime = new RealtimeClient({
  adapter: mqtt({
    url: "wss://broker.example.com/mqtt",
    options: { username, password },
    getSubscribeOptions: () => ({ qos: 1 }),
  }),
});
```

## Behavior

A channel is a topic filter, so `rooms/+` and `rooms/#` work and each publication is routed to every filter its topic matches. `data` is the raw payload `Buffer`, and `native` is the publish packet with its QoS, retain flag, and properties. A granted subscription reports `subscribed`; a rejected one (QoS 128) reports the grant as an error and `unsubscribed`. Because mqtt.js resubscribes silently after a reconnect, channels report `subscribing` while the client is offline and `subscribed` once it reconnects. The connection reports `connecting` after every close unless `reconnectPeriod` is 0.

Root wildcard filters (`#` or `+`) exclude topics starting with `$`; subscribe explicitly to `$SYS/#` for system topics. With `reconnectPeriod: 0`, a closed connection reports `disconnected` and its granted subscriptions report `unsubscribed`.

Messages can arrive before the subscription acknowledgement. After a subscription fails, its handler stops receiving publications, including messages received through an overlapping accepted filter. A connection reconnect alone does not grant a rejected subscription; recreating the subscription starts a new attempt.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
