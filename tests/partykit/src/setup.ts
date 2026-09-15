import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
  const listener = createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const address = listener.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected a local TCP address");
  }
  await new Promise<void>((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  );

  const host = `127.0.0.1:${address.port}`;
  const server = spawn(
    "pnpm",
    [
      "--config.verify-deps-before-run=false",
      "exec",
      "partykit",
      "dev",
      "--port",
      String(address.port),
      "--disable-request-cf-fetch",
      "--no-hotkeys",
    ],
    {
      cwd: project.config.root,
      env: { ...process.env, CI: "true" },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  server.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  let spawnError: Error | undefined;
  const stopped = new Promise<void>((resolve) => {
    server.once("exit", () => resolve());
    server.once("error", (error) => {
      spawnError = error;
      resolve();
    });
  });
  const signalGroup = (signal: NodeJS.Signals | 0) => {
    if (server.pid === undefined) return false;
    try {
      process.kill(-server.pid, signal);
      return true;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ESRCH"
      )
        return false;
      throw error;
    }
  };
  const stop = async () => {
    // pnpm can exit before its workerd child, so clean the whole process group.
    if (!signalGroup("SIGTERM")) return;
    const deadline = Date.now() + 3_000;
    while (signalGroup(0) && Date.now() < deadline) await setTimeout(50);
    signalGroup("SIGKILL");
    await stopped;
  };
  try {
    const deadline = Date.now() + 60_000;
    while (true) {
      if (spawnError !== undefined)
        throw new Error(`PartyKit failed to start: ${output}`, {
          cause: spawnError,
        });
      if (server.exitCode !== null || server.signalCode !== null)
        throw new Error(`PartyKit exited: ${output}`);
      const ready = await fetch(`http://${host}/parties/main/health`, {
        signal: AbortSignal.timeout(1_000),
      })
        .then((response) => response.ok)
        .catch(() => false);
      if (ready) break;
      if (Date.now() > deadline)
        throw new Error(`PartyKit did not start: ${output}`);
      await setTimeout(100);
    }
    project.provide("partykitHost", host);
    return stop;
  } catch (error) {
    await stop();
    throw error;
  }
}

declare module "vitest" {
  // Declaration merging requires an interface for Vitest's injected context.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface ProvidedContext {
    partykitHost: string;
  }
}
