# Pusher protocol integration tests

These tests connect the real `pusher-js` SDK and Simulcast adapter to [Soketi](https://github.com/soketi/soketi), a Pusher Protocol v7 server. The official [Pusher server SDK](https://github.com/pusher/pusher-http-node) signs authorization responses, publishes events, and checks channel occupancy.

No Pusher account or hosted credentials are needed. The app ID, key, and secret in the fixture are local test values.

## Run

Start Docker, then run from the repository root:

```sh
pnpm install
pnpm build
pnpm --filter test-pusher test
```

The suite starts its own Soketi container on an available loopback port and removes it after the run. The image is pinned to version 1.6.1 and a SHA-256 digest. The first run downloads it; subsequent runs reuse Docker's image cache. No existing server or container needs to be stopped.

## Coverage

| Behavior                               | Assertion                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| Public, private, and presence channels | Deliver nested JSON and event metadata through the adapter                                 |
| Shared demand                          | Multiple consumers use one native connection and one subscription per channel              |
| Channel isolation                      | Publications reach only consumers of the addressed channel                                 |
| Consumer cleanup                       | Removing one consumer preserves the others; removing the last releases server occupancy    |
| Resubscription                         | New demand recreates a subscription after its final consumer leaves                        |
| Authorization denial                   | Synchronous denial reaches observers before or after connection; other channels still work |
| Invalid signature                      | The real server rejects a deliberately invalid channel signature                           |
| Reconnection                           | A dropped TCP connection reconnects, reauthorizes, and resumes delivery without duplicates |
| Session replacement                    | Demand survives replacement and stale cleanup leaves the current session connected         |
| Disposal                               | Repeated cleanup releases server subscriptions and sockets                                 |
| Reentrant disposal                     | Cleanup inside a reconnect notification releases the SDK's pending connection attempt      |
| Native presence                        | Member joins and leaves reach native listeners without becoming publications               |

A transparent TCP proxy gives each test control over its own connection. It forwards bytes unchanged to Soketi. Interrupting that connection exercises the SDK's actual retry behavior without restarting a server shared by other tests.

## Limits

Soketi tests Pusher protocol compatibility. It does not verify the hosted Pusher service, regional routing, TLS, HTTP fallback transports, encrypted channels, or account limits. Private-channel signatures are generated through the SDK's `customHandler`; these tests do not exercise an application's HTTP authorization endpoint.

Presence events remain accessible through the native SDK. Simulcast exposes application publications, not a separate presence abstraction.
