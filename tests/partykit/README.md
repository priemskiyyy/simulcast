# PartyKit integration tests

These tests run the real `partysocket` SDK through `simulcast-partykit` against the official PartyKit local development runtime. No account, cloud credentials, or deployment is needed.

From the repository root:

```sh
pnpm install
pnpm build
pnpm test:partykit
```

The suite starts `partykit dev` on an available local port and stops its process group afterward. The fixture uses the local token `local-test-token`; it is not a service credential. The runtime downloads with the workspace dependencies and uses the bundled Cloudflare workerd binary. Run on macOS or Linux, including the Linux CI job in `providers.test.yml`.

## Coverage

- Two consumers share one room socket; the last unsubscribe closes it.
- Publications remain isolated between rooms, with native message metadata preserved.
- A server close triggers reconnect and subsequent messages arrive once.
- Disposal inside a reconnect notification cancels retries.
- Session replacement preserves demand, and stale cleanup cannot stop the replacement.
- A room can be subscribed again after its last consumer leaves.
- Rejected authentication reports a channel error; disposal stops retries.

Room endpoints expose connection counters independently of the adapter, so cleanup assertions check server-side state. Retry cancellation observes several configured retry intervals.

## Limits

This validates the local PartyKit runtime in Node. It does not test deployed Cloudflare routing, regional behavior, storage persistence, hibernation, or browser compatibility. Each room has its own socket; the adapter's shared connection state describes the session, while channel status describes the network connection.
