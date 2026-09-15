import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { promisify } from "node:util";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  // Declaration merging requires an interface for Vitest's injected context.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  export interface ProvidedContext {
    soketiPort: number;
  }
}

export default async (project: TestProject) => {
  const run = promisify(execFile);
  const name = `simulcast-pusher-${randomUUID()}`;
  const cleanup = () => run("docker", ["rm", "--force", name]);

  try {
    await run("docker", [
      "run",
      "--detach",
      "--rm",
      "--name",
      name,
      "--publish",
      "127.0.0.1::6001",
      "--env",
      "SOKETI_DEFAULT_APP_ID=test-app",
      "--env",
      "SOKETI_DEFAULT_APP_KEY=test-key",
      "--env",
      "SOKETI_DEFAULT_APP_SECRET=test-secret",
      "quay.io/soketi/soketi:1.6.1-16-alpine@sha256:5e45fe1adbf2d4ef8022d0126a3c7e4371b7b08f35784b76a2dc353954ee885c",
    ]);
    const { stdout } = await run("docker", ["port", name, "6001/tcp"]);
    const port = Number(stdout.trim().split(":").at(-1));
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`Invalid Soketi port: ${stdout}`);
    }
    const deadline = Date.now() + 60_000;
    while (true) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
          signal: AbortSignal.timeout(1_000),
        });
        if (!response.ok) throw new Error(`Soketi returned ${response.status}`);
        break;
      } catch (error) {
        if (Date.now() >= deadline) {
          const logs = await run("docker", ["logs", name]);
          throw new Error(
            `Soketi did not start:\n${logs.stdout}\n${logs.stderr}`,
            { cause: error },
          );
        }
        await setTimeout(100);
      }
    }
    project.provide("soketiPort", port);
  } catch (error) {
    await cleanup().catch(() => {});
    throw error;
  }

  return async () => {
    await cleanup();
  };
};
