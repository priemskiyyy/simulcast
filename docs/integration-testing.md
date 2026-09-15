---
description: "Run credential-free integration tests against real local SDKs, transports, Pusher-compatible Soketi, PartyKit, Phoenix, and Supabase Realtime."
---

# Provider integration tests

The repository tests adapter behavior through actual SDKs and local network
transports. No hosted provider account or production credential is required.
Local fixture tokens, JWT signing keys, and passwords are test values only.

Use the [mock adapter](testing.md) for application behavior. Use these suites to
verify that adapters handle SDK states, authentication, publications, and cleanup
across a real transport boundary.

## Coverage by provider

| Provider         | Test target                                                        | What it establishes                                                         |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Centrifugo       | Pinned server container with Chromium, Firefox, and WebKit clients | Browser integration and framework behavior                                  |
| Socket.IO        | Local authenticated Socket.IO server                               | Delivery, terminal disconnects, reconnects, and cleanup                     |
| MQTT             | Aedes broker with the real mqtt.js client                          | MQTT 3.1.1 delivery, wildcards, denied filters, reconnects, and cleanup     |
| WebSocket        | Local `ws` server and native Node client                           | Protocol frames, delivery, reconnects, and subscription sharing             |
| SSE              | Local HTTP stream and EventSource client                           | Named and fragmented events, Last-Event-ID, rejection, and retries          |
| BroadcastChannel | Native channel instances                                           | Shared demand, isolation, delivery, and session replacement                 |
| Pusher           | Soketi with the real Pusher client and server SDKs                 | Pusher protocol compatibility, private/presence authorization, and recovery |
| PartyKit         | Official local PartyKit development runtime                        | Room delivery, authentication, reconnects, and socket cleanup               |
| Phoenix          | A real Phoenix application                                         | Topic joins, authentication, publication metadata, and recovery             |
| Supabase         | Official Realtime server with Postgres                             | Broadcast delivery, authorization rejection, reconnects, and cleanup        |
| Ably             | Real Ably SDK with a local token endpoint                          | Authentication failure and disposal during pending authentication           |

::: info What remains outside this coverage
Soketi does not prove hosted Pusher behavior. Ably tests do not deliver messages
through the hosted Ably service. Local tests do not establish production TLS,
proxy behavior, geographic routing, load capacity, or long-running reliability.
:::

## Run the lightweight suite

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test:providers
```

This runs local Socket.IO, MQTT, WebSocket, SSE, BroadcastChannel, and Ably SDK
checks without Docker. It is also included in `pnpm check`.

## Run PartyKit

```sh
pnpm test:partykit
```

The suite starts the official local runtime on an available port and stops it
when finished. It uses the bundled workerd runtime on supported macOS and Linux
hosts. No deployment or provider login is involved.

## Run Pusher-compatible tests

Start Docker, then run:

```sh
pnpm test:pusher
```

The suite starts a pinned Soketi container, publishes through the Pusher server
SDK, and removes its container afterward. Initial setup needs network access to
download the container image.

## Run Phoenix and Supabase

These tests share a local Docker Compose stack. Start it explicitly:

```sh
pnpm --filter test-services services:up
pnpm test:services
pnpm --filter test-services services:down
```

Run `services:down` even if tests fail. It removes this suite's containers and
database volumes. Ports `54331` and `54332` must be free; the first startup also
downloads images and compiles the Phoenix fixture.

The Supabase stack runs Realtime and Postgres. It tests broadcasts, the surface
exposed by this adapter. It does not test Postgres Changes or Presence.

## Run all Node integration suites

With Docker running and the service stack started:

```sh
pnpm --filter test-services services:up
pnpm test:integrations
pnpm --filter test-services services:down
```

Again, run the final cleanup command after a failure. This aggregate command does
not include the separate Centrifugo browser suite:

```sh
pnpm test:browser
```

## Understand a failure

Check the fixture's startup output before treating a timeout as an adapter bug.
A missing Docker daemon, occupied port, image download failure, or unavailable
local runtime can fail before the client connects.

The suite READMEs contain exact implementation details and limits:

- `tests/providers/README.md`
- `tests/partykit/README.md`
- `tests/pusher/README.md`
- `tests/services/README.md`

When adding a regression, assert observable behavior: server-side subscriptions
are released, reconnects resume delivery once, denied channels stay silent, and
old cleanup cannot stop a replacement session. A mocked state event alone cannot
prove those properties across a network.
