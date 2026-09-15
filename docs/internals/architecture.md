---
description: "Understand the Simulcast runtime ownership model, subscription demand, publication delivery, and cleanup ordering."
---

# Runtime architecture

`RealtimeClient` owns the session and the adapter connection. `RealtimeChannels`
owns channel registrations and shared subscriptions. Neither is exported; the
client exposes observable views and `channel()` handles.

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
