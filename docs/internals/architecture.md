---
description: "Understand the Simulcast runtime ownership model, subscription demand, publication delivery, and cleanup ordering."
---

# Runtime architecture

`RealtimeClient` owns the session and the adapter connection. `RealtimeChannels`
owns channel registrations and shared subscriptions. Neither is exported; the
client exposes observable views and `channel()` handles.

## Principles

1. Normalize lifecycle, not protocols.
2. Provider-native APIs remain accessible.
3. One logical channel has one owned native subscription per active session.
4. Consumers share resources.
5. Passive observation does not create demand.
6. Cleanup is deterministic and idempotent.
7. Obsolete resources cannot affect their replacements.
8. Adapters translate; the core owns policy.
9. Framework bindings remain thin.
10. Diagnostics never alter runtime demand.

## Ownership

A session is a record holding the adapter connection and a `ResourceScope`.
Replacing it disposes the previous scope, which cascades to every adopted
attachment scope. A channel record holds its name, status snapshot, consumer
sets, and current attachment. Logical registrations survive session replacement;
their native subscriptions do not.

Publication consumers and status observers have separate consumer sets.
Publication consumers create demand for a native subscription. Status observers
retain the channel record without opening one. Each cleanup removes its own
registration, so duplicate callbacks remain independent.

## Starting a session

`connect()` performs these steps:

1. Reserve a new scope and release the previous session.
2. Call `adapter.connect` with an observer bound to the scope.
3. Register connection cleanup and expose the active session.
4. Attach channels with existing demand.

Adapter callbacks and observer cleanup can synchronously replace the session.
Setup checks its scope after those calls. An ended setup cannot continue, and an
older cleanup cannot clear a newer session. If setup fails, its scope releases
acquired resources and the client remains inactive.

## Sharing a subscription

| Operation           | Result                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Read a channel      | Return a handle without creating resources.                                                                                                   |
| Register a consumer | Add the registration, then check subscription demand.                                                                                         |
| Check demand        | Require an active session and publication consumers; reuse an attachment for that session.                                                    |
| Attach              | Reserve the channel, call `connection.subscribe` with a scope-bound observer, register its disposal.                                          |
| Release             | Remove the registration; dispose the native subscription after the last publication consumer, and the channel record after the last consumer. |

Attachment is reserved before the adapter is called, so a reentrant registration
cannot create a second subscription. Its scope belongs to the session scope, so
ending the session removes native subscriptions even when consumers remain
mounted. Native removal completes before the attachment is cleared and `detached`
is published, so a status observer can request the same channel again without
colliding with the previous subscription.

## Delivering publications

The adapter's observer dispatches to a snapshot of the channel's consumers.
Removed consumers are skipped; new consumers wait for the next publication.
Disposing the attachment during dispatch stops the remaining delivery.
Synchronous exceptions and rejected promises are reported outside the adapter's
callback so other consumers continue.

Status updates happen before application handlers run. Repeated equal states are
ignored, since providers may report the same state while retrying. Events are
not replayed; hooks read current values from snapshots instead.

## Cleanup and observation

`ResourceScope` collects synchronous cleanup functions. Disposal is idempotent,
runs in reverse order, and attempts every cleanup even if one fails. `setup`
rolls back acquired resources on failure. `adopt` connects a child lifetime to
its parent.

`ValueStore` exposes `get`, `set`, and `subscribe`. Observation contracts expose
only `get` and `subscribe`. A nested update supersedes the older notification
pass, so later listeners see the latest snapshot once.

`createRealtimeAdapter` wraps adapters with idempotent disposal, owned
subscription teardown, and observer silencing. The core still performs its own
scope checks on every callback, because adapters, SDKs, and test doubles can be
wrong.

## Invariants and the tests that guard them

Each row names the regression test in `packages/core` (or `packages/devtools`)
that fails when the invariant breaks.

| Invariant                                            | Test                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| One native subscription per channel and session      | many consumers share a single adapter subscription across session replacements                                 |
| Passive observers create no demand                   | channel handles remain reusable after cleanup without passive observers retaining subscriptions                |
| Devtools create no demand                            | the panel observes a client without creating subscriptions and hides payloads by default                       |
| Stale sessions cannot touch their replacement        | stale session cleanup and state events cannot affect the next session                                          |
| Late adapter callbacks are ignored                   | a late adapter callback after the last consumer leaves is ignored                                              |
| Cleanup is idempotent and per registration           | identical callbacks retain independent subscriptions and cleanup is idempotent                                 |
| Cleanup runs in reverse order and tolerates failures | a scope releases resources in reverse order and allows early release; a failed cleanup cannot prevent the rest |
| Failed setup rolls back                              | subscription setup failure rolls back ownership so the channel can be retried                                  |
| Reentrant replacement keeps only the latest session  | replacing the session from a channel state callback keeps only the latest connection and subscriptions         |
| Startup handles channel churn once                   | channel changes during session startup skip evicted channels and subscribe newly retained ones once            |
| Native context survives delivery                     | publications reach consumers with their event name and native context intact                                   |
| Consumer failures are isolated                       | snapshot listener failures leave later listeners and future updates intact                                     |
| Diagnostics are passive                              | events are recorded only while an observer is present                                                          |
| Adapters are silent after dispose                    | a disposed subscription is released once and no longer reports, plus every adapter's `conformance.test.ts`     |
