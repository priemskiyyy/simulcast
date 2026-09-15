# Local Phoenix and Supabase tests

Run the real JavaScript SDKs and built Simulcast adapters against a small Phoenix application and the official Supabase Realtime server. Everything runs locally. No provider account or hosted API key is needed.

## Run

Prerequisites: the repository's supported Node.js and pnpm versions, Docker with Compose, and enough disk space for the Supabase Postgres image. The first run downloads images and compiles the Phoenix server. Later runs reuse the build cache.

From the repository root:

```sh
pnpm install
pnpm build
pnpm --filter test-services services:up
pnpm --filter test-services test
pnpm --filter test-services services:down
```

Always run `services:down` after testing, including after a failure. It removes this suite's containers, network, and database volumes. It does not stop other Docker projects.

The services bind to loopback only:

| Service           | Address                  | Implementation                                                        |
| ----------------- | ------------------------ | --------------------------------------------------------------------- |
| Phoenix           | `http://127.0.0.1:54331` | Phoenix 1.8.14 with Bandit; dependencies pinned in `phoenix/mix.lock` |
| Supabase Realtime | `http://127.0.0.1:54332` | `supabase/realtime:v2.134.10`                                         |
| Supabase Postgres | Docker network only      | `supabase/postgres:17.6.1.136`                                        |

These ports must be free. The test fixtures are intentionally local-only: their signing secret, socket tokens, and database password are public test values. Do not reuse this configuration for a deployed application.

## Coverage

Both adapters run the same behavior checks:

- Disposing before the initial connection and channel join finish releases pending work.
- Invalid connection credentials produce an error and never establish a connection.
- A channel can subscribe again after its last consumer leaves.
- Multiple consumers receive publications with event names and payloads preserved.
- Separate topics stay isolated; removed consumers stop receiving publications.
- A lost connection recovers and resumes delivery without duplicates.
- Session replacement preserves demand; cleanup from the previous session cannot disconnect it.
- Rejected channels report authorization errors and remain silent beside working channels.
- Disposing during reconnect releases the transport and cancels retries.

Phoenix uses socket and channel tokens checked by the fixture application. Its reconnect tests ask the server to disconnect a specific socket through Phoenix's endpoint broadcast API. Publications use the endpoint's actual broadcast path, including normal join and reply frames.

Supabase signs short-lived local JWTs. An `anon` client receives public broadcasts; a `service_role` publisher uses the server's HTTP broadcast API. Private-channel rejection uses the database's default-deny authorization rules. Reconnect tests interrupt the actual WebSocket transport. The fixture sets the local tenant's `Host` header because Realtime routes tenants by hostname.

## Scope

This suite covers the adapters' publication and lifecycle contracts. It does not test hosted service operations, TLS termination, multiple server nodes, or production infrastructure.

The Supabase adapter exposes broadcasts as Simulcast publications. Postgres Changes and Presence remain native SDK features and are outside this suite. The stack therefore runs only Realtime and Postgres, without Studio, Auth, Storage, or the API gateway.

The custom WebSocket constructor uses `ws` so tests can track and interrupt real connections. Supabase's DOM event declarations differ from `@types/ws`; the fixture contains one constructor type assertion at that boundary. Application and adapter code need no type assertions or API changes.

## Troubleshooting

Inspect startup failures from the repository root:

```sh
docker compose -f tests/services/compose.yaml ps
docker compose -f tests/services/compose.yaml logs phoenix supabase database
```

After changing database initialization, run `services:down` before starting again so the SQL runs against a new database. After changing the Phoenix application, `services:up` rebuilds its image.

## Upstream references

- [Phoenix endpoint and socket configuration](https://phoenix.hexdocs.pm/Phoenix.Endpoint.html)
- [Supabase self-hosted Docker configuration](https://github.com/supabase/supabase/blob/master/docker/docker-compose.yml)
- [Supabase Realtime development and tenant routing](https://github.com/supabase/realtime/blob/main/DEVELOPERS.md)
- [Pinned Realtime server routes](https://github.com/supabase/realtime/blob/v2.134.10/lib/realtime_web/router.ex)
