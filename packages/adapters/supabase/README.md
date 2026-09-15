# simulcast-supabase

[Supabase Realtime](https://supabase.com/docs/guides/realtime) adapter for [simulcast](../../core). Requires `@supabase/realtime-js` 2.

## Installation

```sh
pnpm add simulcast simulcast-supabase @supabase/realtime-js
```

## Create a client

```ts
import { RealtimeClient } from "simulcast";
import { supabase } from "simulcast-supabase";

const realtime = new RealtimeClient({
  adapter: supabase({
    url: "wss://project.supabase.co/realtime/v1",
    options: {
      params: { apikey: SUPABASE_ANON_KEY },
      accessToken: getAccessToken,
    },
    getChannelOptions: () => ({ config: { private: true } }),
  }),
});
```

## Behavior

A channel is a Supabase topic. Every broadcast on it becomes a publication whose `event` is the broadcast event and whose `data` is its payload; Postgres changes and presence are provider features and stay on the native channel through `realtime.native`. `SUBSCRIBED` reports `subscribed`; `CHANNEL_ERROR` and `TIMED_OUT` report `subscribing`, because realtime-js keeps rejoining until the channel is removed. A subscription callback error is forwarded when the SDK supplies one. The socket reports `connecting` after every close for the same reason.

## Guides

- [Installation and framework setup](../../../docs/installation.md)
- [Adapter configuration and state mappings](../../../docs/adapters.md)
- [Connection sessions](../../../docs/sessions.md)
- [Testing consumers without a provider](../../../docs/testing.md)

## License

[MIT](LICENSE)
