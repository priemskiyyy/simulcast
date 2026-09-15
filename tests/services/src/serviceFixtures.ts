import { createHmac, randomUUID } from "node:crypto";
import { request } from "node:http";
import { phoenix } from "@priemskiyyy/simulcast-phoenix";
import { supabase } from "@priemskiyyy/simulcast-supabase";
import { webSocketTransport } from "./webSocketTransport";

const phoenixUrl = "http://127.0.0.1:54331";
const supabaseUrl = "http://127.0.0.1:54332";
const supabaseHost = "realtime-dev.localhost";

const supabaseToken = (role: string) => {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url");
  const signature = createHmac(
    "sha256",
    "local-simulcast-jwt-secret-at-least-32-characters",
  )
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
};

export const phoenixFixture = (token = "local-socket-token") => {
  const network = webSocketTransport();
  const session = randomUUID();
  return {
    ...network,
    adapter: phoenix({
      url: `${phoenixUrl}/socket`,
      options: {
        transport: network.transport,
        params: { token, session },
        reconnectAfterMs: () => 50,
        rejoinAfterMs: () => 50,
      },
      getChannelParams: (channel) => ({
        token: channel.endsWith("denied") ? "invalid" : "local-channel-token",
      }),
    }),
    drop: async () => {
      const response = await fetch(`${phoenixUrl}/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });
      if (!response.ok)
        throw new Error(`Phoenix disconnect failed: ${response.status}`);
    },
    publish: async (topic: string, text: string) => {
      const response = await fetch(`${phoenixUrl}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, event: "message", payload: { text } }),
      });
      if (!response.ok)
        throw new Error(`Phoenix publish failed: ${response.status}`);
    },
  };
};

export const supabaseFixture = (token = supabaseToken("anon")) => {
  const network = webSocketTransport({ Host: supabaseHost });
  return {
    ...network,
    adapter: supabase({
      url: `${supabaseUrl}/socket`,
      options: {
        // The SDK accepts ws, but its DOM event declarations differ from @types/ws.
        transport: network.transport as NonNullable<
          NonNullable<Parameters<typeof supabase>[0]["options"]>["transport"]
        >,
        params: { apikey: token },
        reconnectAfterMs: () => 50,
      },
      getChannelOptions: (channel) => ({
        config: { private: channel.endsWith("denied") },
      }),
    }),
    publish: (topic: string, text: string) =>
      new Promise<void>((resolve, reject) => {
        const publication = request(
          `${supabaseUrl}/api/broadcast`,
          {
            method: "POST",
            headers: {
              Host: supabaseHost,
              Authorization: `Bearer ${supabaseToken("service_role")}`,
              "Content-Type": "application/json",
            },
          },
          (response) => {
            response.resume();
            response.on("error", reject);
            response.on("end", () => {
              if (response.statusCode !== 202) {
                reject(
                  new Error(`Supabase publish failed: ${response.statusCode}`),
                );
                return;
              }
              resolve();
            });
          },
        );
        publication.on("error", reject);
        publication.end(
          JSON.stringify({
            messages: [{ topic, event: "message", payload: { text } }],
          }),
        );
      }),
  };
};
