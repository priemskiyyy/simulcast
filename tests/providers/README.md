# Local provider integration tests

Run from the repository root:

```sh
pnpm build
pnpm test:providers
```

These tests import the built public packages and exercise real SDKs and network transports. They run in Node on random loopback ports, with no Docker, cloud credentials, SDK mocks, or fake clocks. They are part of `pnpm check` and the package CI matrix on Node 22 and 24.

## Coverage

| Provider         | Local implementation                                   | Scenarios                                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Socket.IO        | Socket.IO server with authentication middleware        | Shared demand, event isolation, disposal, session replacement, reconnect, retry cancellation, resource cleanup, rejected authentication, terminal disconnect                                              |
| MQTT             | Aedes broker over TCP, authenticated mqtt.js client    | Shared demand, topic isolation, disposal, session replacement, reconnect, resource cleanup, rejected credentials and filters, overlapping filters, wildcard and system-topic routing, terminal disconnect |
| WebSocket        | ws server and Node's native WebSocket client           | Shared demand, channel isolation, disposal, session replacement, reconnect, retry cancellation, subscribe/unsubscribe frames                                                                              |
| SSE              | HTTP server and EventSource client                     | Shared demand, stream isolation, disposal, session replacement, reconnect, HTTP rejection, fragmented named events, multiline data, Last-Event-ID                                                         |
| BroadcastChannel | Native BroadcastChannel instances                      | Shared demand, channel isolation, disposal, session replacement without duplicate delivery                                                                                                                |
| Ably             | Real Ably SDK and a local HTTP authentication endpoint | Denied authentication, disposal while authentication is pending, ignored late responses, disposal inside an error notification                                                                            |

The shared contracts live in `src/providers.test.ts`; provider-specific assertions live beside their fixtures. Server-side subscription and connection counters verify cleanup independently of the client runtime. Negative delivery assertions use subsequent messages as barriers where possible; retry cancellation checks observe several configured retry intervals.

Ably tests point both SDK hosts at loopback and disable fallback hosts. They test the SDK's authentication and cleanup paths without contacting Ably. **They do not test successful Ably connections, channel attachment, or hosted message delivery.**

## More credential-free suites

| Suite                                         | Command              | Infrastructure                                                                 |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| [PartyKit](../partykit/README.md)             | `pnpm test:partykit` | Official PartyKit local runtime, started and stopped by the tests              |
| [Pusher](../pusher/README.md)                 | `pnpm test:pusher`   | Real Pusher SDK against a pinned Soketi Docker container, managed by the tests |
| [Phoenix and Supabase](../services/README.md) | `pnpm test:services` | Actual Phoenix and Supabase Realtime servers; start the Docker stack first     |
| Centrifugo                                    | `pnpm test:browser`  | Real Centrifugo Docker server, Chromium, Firefox, and WebKit                   |

To run the Node integration suites together:

```sh
pnpm build
pnpm --filter test-services services:up
pnpm test:integrations
pnpm --filter test-services services:down
```

Run `services:down` even when a test fails. The separate `providers-test` workflow performs cleanup in an `always()` step. The Centrifugo browser suite remains separate.

## Limits

- Local transport coverage does not establish production TLS/proxy behavior, load capacity, or long-running reliability.
- Pusher tests use a compatible server, not hosted Pusher. Ably service behavior requires a separate hosted test app.
- Browser coverage is currently provided by the Centrifugo suite. Node provider tests do not prove all SDK/browser combinations.
- Aedes exercises MQTT 3.1.1. MQTT 5, retained/session-persistent delivery, and other brokers' ACL behavior need separate coverage.
