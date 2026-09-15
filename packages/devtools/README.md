# @priemskiyyy/simulcast-devtools

Inspect the realtime connection, channel subscriptions, and events of any simulcast adapter. The inspector is framework-independent and renders inside a shadow root; wrappers for React, Vue, Solid, and Svelte read the client from their provider.

```sh
pnpm add -D @priemskiyyy/simulcast-devtools
```

```tsx
import { RealtimeProvider } from "@priemskiyyy/simulcast-react";
import { SimulcastDevtools } from "@priemskiyyy/simulcast-devtools/react";

<RealtimeProvider client={realtime}>
  <App />
  {import.meta.env.DEV ? <SimulcastDevtools initialIsOpen /> : null}
</RealtimeProvider>;
```

The Svelte wrapper requires Svelte `>=5.29 <6` because it uses attachments.

The same component ships under `@priemskiyyy/simulcast-devtools/vue` and `@priemskiyyy/simulcast-devtools/solid`; Svelte gets a `createDevtools()` attachment under `@priemskiyyy/simulcast-devtools/svelte`. Without a framework, `new SimulcastDevtools({ client })` from the package root mounts into any element and follows a replacement client through `setClient`. Use your bundler's development flag; the examples use Vite.

The header shows the adapter, the session, and the connection state, and docks the panel to the bottom or the right edge. The sidebar lists every channel with registered listeners, its state, listener counts, and the last error; selecting one filters the timeline to that channel plus connection events. Timeline rows show the local time, the event type, the channel, and a summary, coloured by kind, with chips that filter one kind at a time and a search box for everything else. Expanding a row shows the full context with a copy button.

Recording starts when the panel mounts and continues while collapsed. Pause and Clear affect only the inspector. Payload capture is off by default and redacts property names such as `token`, `authorization`, and `password`. Contexts are copied into bounded text at capture time, so history retains no SDK objects. `maxEvents` is clamped to 1–1000. The open state, dock position, and size persist in `localStorage`.

Devtools never creates subscriptions or keeps channels alive. The panel is built on `client.diagnostics`, which any custom integration can read as well.

## License

[MIT](LICENSE)
