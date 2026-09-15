import { createServer } from "node:http";
import type { ServerResponse } from "node:http";
import { setTimeout } from "node:timers/promises";
import { RealtimeClient } from "simulcast";
import type { RealtimeDiagnosticEvent } from "simulcast";
import { ably } from "simulcast-ably";
import { expect, onTestFinished, test, vi } from "vitest";
import { listen } from "./listen";

const fixture = async (respond: (response: ServerResponse) => void) => {
  let requests = 0;
  const server = createServer((request, response) => {
    if (request.url?.startsWith("/auth") !== true) {
      response.writeHead(404).end();
      return;
    }
    requests++;
    respond(response);
  });
  const address = await listen(server);
  onTestFinished(() => {
    server.closeAllConnections();
    return new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  const port = Number(new URL(`http://${address}`).port);
  const client = new RealtimeClient({
    adapter: ably({
      options: {
        authUrl: `http://${address}/auth`,
        restHost: "127.0.0.1",
        realtimeHost: "127.0.0.1",
        port,
        tls: false,
        fallbackHosts: [],
        transports: ["web_socket"],
        disconnectedRetryTimeout: 50,
        httpMaxRetryCount: 0,
        logLevel: 0,
      },
    }),
  });
  const events: RealtimeDiagnosticEvent[] = [];
  onTestFinished(
    client.diagnostics.events.subscribe((event) => {
      events.push(event);
    }),
  );
  return { client, events, requests: () => requests };
};

test("Ably surfaces a real auth endpoint rejection and never delivers to the denied channel", async () => {
  const provider = await fixture((response) =>
    response
      .writeHead(403, { "Content-Type": "text/plain" })
      .end("Access denied"),
  );
  const room = provider.client.channel("denied");
  const publication = vi.fn();
  onTestFinished(room.subscribe(publication));
  onTestFinished(provider.client.connect());
  await expect
    .poll(() =>
      provider.events.some(
        (event) => event.source === "connection" && event.type === "error",
      ),
    )
    .toBe(true);
  await expect
    .poll(() => provider.client.native.get()?.connection.state)
    .toBe("failed");
  expect(provider.client.connection.get()).toBe("disconnected");
  expect(room.status.get().state).toBe("unsubscribed");
  expect(room.status.get().error).not.toBeNull();
  expect(publication).not.toHaveBeenCalled();
  expect(provider.requests()).toBe(1);
});

test("Ably closes while authentication is pending and ignores a late HTTP response", async () => {
  let pending: ServerResponse | undefined;
  const provider = await fixture((response) => {
    pending = response;
  });
  const stop = provider.client.connect();
  onTestFinished(stop);
  await expect.poll(provider.requests).toBe(1);
  const native = provider.client.native.get();
  expect(native).not.toBeNull();
  stop();
  await expect.poll(() => native?.connection.state).toBe("closed");
  const eventCount = provider.events.length;
  if (pending === undefined)
    throw new Error("Expected a pending authorization request");
  pending.writeHead(403).end("Denied after disposal");
  await setTimeout(150);
  expect(provider.events).toHaveLength(eventCount);
  expect(provider.requests()).toBe(1);
  expect(provider.client.native.get()).toBeNull();
  expect(provider.client.connection.get()).toBe("disconnected");
});

test("Ably authentication failure can synchronously dispose the session without restarting it", async () => {
  const provider = await fixture((response) =>
    response.writeHead(500).end("Temporary auth failure"),
  );
  const stop = provider.client.connect();
  onTestFinished(stop);
  onTestFinished(
    provider.client.diagnostics.events.subscribe((event) => {
      if (event.source === "connection" && event.type === "error") stop();
    }),
  );
  await expect.poll(() => provider.client.native.get()).toBeNull();
  const requests = provider.requests();
  await setTimeout(200);
  expect(provider.requests()).toBe(requests);
  expect(provider.client.connection.get()).toBe("disconnected");
});
