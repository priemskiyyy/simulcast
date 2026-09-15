import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { clearTimeout, setTimeout } from "node:timers";
import { fileURLToPath } from "node:url";

const workspace = fileURLToPath(new URL("..", import.meta.url));
const artifacts = path.join(workspace, ".artifacts");
const release = path.join(artifacts, "release");
const consumer = mkdtempSync(path.join(tmpdir(), "simulcast-consumer-"));
const rootPackage = JSON.parse(
  readFileSync(path.join(workspace, "package.json"), "utf8"),
);

const run = (command, args, cwd = consumer) => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout: 180_000,
  });

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
      { cause: result.error },
    );
  }

  return result.stdout;
};

const write = (name, content) =>
  writeFileSync(path.join(consumer, name), content);
const json = (name, value) =>
  write(name, `${JSON.stringify(value, null, 2)}\n`);

// Copies a packed tarball with its checksum into the directory the publish
// workflow uploads as the release artifact.
const stageRelease = (name, tarball) => {
  const directory = path.join(release, name);
  const filename = path.basename(tarball);
  const checksum = createHash("sha256")
    .update(readFileSync(tarball))
    .digest("hex");
  mkdirSync(directory, { recursive: true });
  copyFileSync(tarball, path.join(directory, filename));
  writeFileSync(
    path.join(directory, "SHA256SUMS"),
    `${checksum}  ${filename}\n`,
  );
};

const verifyWatchShutdown = (cli) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, "watch"], {
      cwd: consumer,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let ready = false;
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Watcher failed to start or stop:\n${output}`));
    }, 10000);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();

      if (ready || !output.includes("Watching event types")) {
        return;
      }

      ready = true;
      child.kill("SIGINT");
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timeout);

      if (!ready || signal !== null || (code !== 0 && code !== 130)) {
        reject(
          new Error(
            `Watcher exited unexpectedly (${code}, ${signal}):\n${output}`,
          ),
        );
        return;
      }

      resolve();
    });
  });

try {
  rmSync(release, { recursive: true, force: true });
  mkdirSync(artifacts, { recursive: true });
  const tarballs = ["packages", "packages/adapters"].flatMap((group) =>
    readdirSync(path.join(workspace, group))
      .filter((directory) =>
        existsSync(path.join(workspace, group, directory, "package.json")),
      )
      .map((directory) => {
        const packageDirectory = path.join(workspace, group, directory);
        process.stdout.write(
          run("pnpm", ["exec", "publint", packageDirectory], workspace),
        );
        const [packed] = JSON.parse(
          run(
            "npm",
            [
              "pack",
              "--ignore-scripts",
              "--json",
              "--pack-destination",
              artifacts,
            ],
            packageDirectory,
          ),
        );
        assert(packed.files.some((file) => file.path === "README.md"));
        assert(packed.files.some((file) => file.path === "LICENSE"));
        assert(!packed.files.some((file) => file.path.startsWith("src/")));
        assert(
          !packed.files.some((file) =>
            /\.(test|fixture|contracts)\./.test(file.path),
          ),
        );
        const tarball = path.join(artifacts, packed.filename);
        stageRelease(packed.name, tarball);
        return tarball;
      }),
  );

  json("package.json", {
    name: "simulcast-package-consumer",
    private: true,
    type: "module",
    dependencies: Object.fromEntries(
      [
        "react",
        "react-dom",
        "centrifuge",
        "pusher-js",
        "ably",
        "@supabase/realtime-js",
        "socket.io-client",
        "phoenix",
        "@types/phoenix",
        "mqtt",
        "partysocket",
        "vue",
        "solid-js",
        "svelte",
        "typescript",
        "vite",
        "@types/react",
        "@types/react-dom",
      ].map((name) => [name, rootPackage.devDependencies[name]]),
    ),
  });
  process.stdout.write(
    "Installing packed packages in an isolated consumer...\n",
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    ...tarballs,
  ]);

  const bundles = [
    { file: "simulcast/dist/index.js", client: false },
    { file: "simulcast-react/dist/index.js", client: true },
    { file: "simulcast-devtools/dist/index.js", client: false },
    { file: "simulcast-devtools/dist/react.js", client: true },
  ];
  for (const { file, client } of bundles) {
    const bundle = readFileSync(
      path.join(consumer, "node_modules", file),
      "utf8",
    );
    assert.doesNotMatch(bundle, /from ["']src\//);
    assert.doesNotMatch(bundle, /from ["']effect/);
    assert.equal(/^"use client";/.test(bundle), client, file);
  }
  // The core bundles its own Solid runtime, so a host without Solid still works.
  assert.doesNotMatch(
    readFileSync(
      path.join(consumer, "node_modules/simulcast-devtools/dist/index.js"),
      "utf8",
    ),
    /from ["']solid-js/,
  );
  const declarations = readFileSync(
    path.join(consumer, "node_modules/simulcast/dist/index.d.ts"),
    "utf8",
  );
  assert.match(declarations, /@example/);
  assert.doesNotMatch(
    declarations,
    /RealtimeChannels|ResourceScope|ValueStore/,
  );

  json("tsconfig.json", {
    compilerOptions: {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      lib: ["ES2022", "DOM"],
      types: ["vite/client"],
    },
    include: ["*.ts", "*.tsx", "generated/*.ts"],
  });
  json("realtime.config.json", {
    events: { file: "events.ts", type: "Events" },
    dispatcher: { file: "runtime.ts", export: "useChannelEvent" },
    output: "generated",
  });
  write(
    "events.ts",
    'export type Events = { "message.created": { channel: `rooms:${string}`; payload: { text: string } } };\n',
  );
  write(
    "runtime.ts",
    'import { createChannelEventHooks } from "simulcast-react"; import type { Events } from "./events.js"; export const { useChannelEvent } = createChannelEventHooks<Events>({ decode: () => null });\n',
  );
  write(
    "contracts.ts",
    `import type { Centrifuge } from "centrifuge";
import { RealtimeClient } from "simulcast";
import { ably } from "simulcast-ably";
import { broadcastChannel } from "simulcast-broadcast-channel";
import { centrifugo } from "simulcast-centrifugo";
import { useCentrifuge } from "simulcast-centrifugo/react";
import { mqtt } from "simulcast-mqtt";
import { phoenix } from "simulcast-phoenix";
import { pusher } from "simulcast-pusher";
import { useChannel, useRealtimeClient } from "simulcast-react";
import { partykit } from "simulcast-partykit";
import { socketio } from "simulcast-socketio";
import { sse } from "simulcast-sse";
import { supabase } from "simulcast-supabase";
import { websocket } from "simulcast-websocket";
import { useMessageCreated } from "./generated/index.js";
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
export const clients = [
  new RealtimeClient({ adapter: centrifugo({ transport: "ws://localhost" }) }),
  new RealtimeClient({ adapter: pusher({ key: "key", options: { cluster: "eu" } }) }),
  new RealtimeClient({ adapter: ably({ options: { key: "app.key:secret" } }) }),
  new RealtimeClient({ adapter: supabase({ url: "ws://localhost/realtime/v1", options: { params: { apikey: "anon" } } }) }),
  new RealtimeClient({ adapter: socketio({ url: "http://localhost" }) }),
  new RealtimeClient({ adapter: phoenix({ url: "ws://localhost/socket" }) }),
  new RealtimeClient({ adapter: mqtt({ url: "mqtt://localhost" }) }),
  new RealtimeClient({ adapter: websocket({ url: "ws://localhost", protocol: { subscribe: () => null, unsubscribe: () => null, decode: () => null } }) }),
  new RealtimeClient({ adapter: sse({ url: (channel) => \`/events/\${channel}\` }) }),
  new RealtimeClient({ adapter: partykit({ host: "localhost" }) }),
  new RealtimeClient({ adapter: broadcastChannel() }),
];
export const useContracts = () => {
  const client = useCentrifuge();
  const nullableClient: Equal<typeof client, Centrifuge | null> = true;
  const native = useRealtimeClient().native.get();
  const unknownNative: Equal<typeof native, unknown> = true;
  useChannel<{ text: string }>("raw", (data) => { data.text.toUpperCase(); });
  useChannel("raw", (data) => { data.toFixed(); }, { parse: Number });
  useMessageCreated("rooms:one", (data) => { data.text.toUpperCase(); });
  // @ts-expect-error Generated channel contract is enforced.
  useMessageCreated("wrong", () => {});
  // @ts-expect-error Generated payload cannot be overridden with a generic.
  useMessageCreated<number>("rooms:one", () => {});
  // @ts-expect-error A parser must produce the event payload.
  useMessageCreated("rooms:one", () => {}, { parse: Number });
  // @ts-expect-error The client can be absent.
  client.publish("room", {});
  return [nullableClient, unknownNative];
};\n`,
  );
  write(
    "vue-contracts.ts",
    `import { defineComponent, h, ref } from "vue";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { SimulcastDevtools } from "simulcast-devtools/vue";
import { RealtimeProvider, useChannel, useChannelStatus } from "simulcast-vue";
const realtime = new RealtimeClient({ adapter: createMockAdapter().adapter });
const Room = defineComponent(() => {
  const room = ref("demo");
  useChannel<{ text: string }>(() => \`rooms:\${room.value}\`, (message) => { message.text.toUpperCase(); });
  const status = useChannelStatus(room);
  return () => h("p", status.value.state);
});
export const Application = defineComponent(() => () => h(RealtimeProvider, { client: realtime, session: { id: "consumer" } }, { default: () => [h(Room), h(SimulcastDevtools, { initialIsOpen: true })] }));\n`,
  );
  write(
    "solid-contracts.ts",
    `import { createSignal } from "solid-js";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { SimulcastDevtools } from "simulcast-devtools/solid";
import { useChannel, useChannelStatus, useRealtimeClient } from "simulcast-solid";
export const devtools = () => SimulcastDevtools({ initialIsOpen: true });
export const realtime = new RealtimeClient({ adapter: createMockAdapter().adapter });
export const useRoom = () => {
  const [room] = createSignal("demo");
  useChannel<{ text: string }>(() => \`rooms:\${room()}\`, (message) => { message.text.toUpperCase(); });
  const status = useChannelStatus(room);
  return { status, client: useRealtimeClient() };
};\n`,
  );
  write(
    "svelte-contracts.ts",
    `import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { createDevtools } from "simulcast-devtools/svelte";
import { useChannel, useChannelStatus, useRealtimeClient } from "simulcast-svelte";
export const devtools = () => createDevtools({ maxEvents: 50 });
export const realtime = new RealtimeClient({ adapter: createMockAdapter().adapter });
export const useRoom = (room: () => string) => {
  useChannel<{ text: string }>(() => \`rooms:\${room()}\`, (message) => { message.text.toUpperCase(); });
  const status = useChannelStatus(room);
  return { status, client: useRealtimeClient() };
};\n`,
  );
  write(
    "main.tsx",
    `import { createRoot } from "react-dom/client";
import { RealtimeClient } from "simulcast";
import { centrifugo } from "simulcast-centrifugo";
import { SimulcastDevtools } from "simulcast-devtools/react";
import { RealtimeProvider } from "simulcast-react";
import { useMessageCreated } from "./generated/index.js";
const realtime = new RealtimeClient({ adapter: centrifugo({ transport: "ws://localhost" }) });
const Messages = () => { useMessageCreated("rooms:one", () => {}); return <p>Connected</p>; };
createRoot(document.body).render(<RealtimeProvider client={realtime} session={{ enabled: false }}><Messages />{import.meta.env.DEV ? <SimulcastDevtools /> : null}</RealtimeProvider>);\n`,
  );
  write(
    "index.html",
    '<html><body><script type="module" src="/main.tsx"></script></body></html>\n',
  );
  write(
    "ssr.mjs",
    `import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { SimulcastDevtools } from "simulcast-devtools/react";
import { RealtimeProvider, useChannel, useConnectionState, useRealtimeClient } from "simulcast-react";
const { adapter, connections } = createMockAdapter();
const realtime = new RealtimeClient({ adapter });
const Child = () => { useChannel("rooms:one", () => {}); return createElement("span", null, useConnectionState()); };
assert.equal(renderToString(createElement(RealtimeProvider, { client: realtime }, createElement(Child))), "<span>disconnected</span>");
const Inspector = () => { assert.equal(useRealtimeClient().diagnostics.get().session, null); return createElement(SimulcastDevtools, { initialIsOpen: true }); };
assert.match(renderToString(createElement(RealtimeProvider, { client: realtime }, createElement(Inspector))), /data-simulcast-devtools/);
assert.deepEqual(connections, []);\n`,
  );

  const codegen = path.join(consumer, "node_modules/simulcast-codegen");
  const metadata = JSON.parse(
    readFileSync(path.join(codegen, "package.json"), "utf8"),
  );
  const cli = path.join(codegen, metadata.bin["simulcast-codegen"]);
  const stale = spawnSync(process.execPath, [cli, "check"], {
    cwd: consumer,
    encoding: "utf8",
  });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Generated hooks are stale/);
  assert.equal(stale.stdout, "");
  const invalidArguments = spawnSync(
    process.execPath,
    [cli, "generate", "--config"],
    { cwd: consumer, encoding: "utf8" },
  );
  assert.equal(invalidArguments.status, 1);
  assert.match(invalidArguments.stderr, /--config/);
  assert.equal(invalidArguments.stdout, "");
  run(process.execPath, [cli, "generate"]);
  run(process.execPath, [cli, "check"]);
  run(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"]);
  run(process.execPath, ["ssr.mjs"]);
  run(process.execPath, ["node_modules/vite/bin/vite.js", "build"]);
  const assets = path.join(consumer, "dist/assets");
  const production = readdirSync(assets)
    .filter((name) => name.endsWith(".js") || name.endsWith(".css"))
    .map((name) => readFileSync(path.join(assets, name), "utf8"))
    .join("\n");
  assert.doesNotMatch(
    production,
    /Capture payloads|Circular or repeated reference|Simulcast devtools/,
  );
  await verifyWatchShutdown(cli);
  process.stdout.write(
    `Packed consumer passed for ${tarballs.length} packages: imports, adapters, generated types, SSR, browser build, CLI drift detection, and watcher shutdown.\n`,
  );
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
