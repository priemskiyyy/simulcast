<script setup lang="ts">
import { computed, ref } from "vue";
import { withBase } from "vitepress";

const frameworks = [
  {
    name: "React",
    install: "simulcast-react",
    guide: "/hooks",
    file: "Room.tsx",
    code: `import type * as React from "react";
import { useState } from "react";
import { useChannel } from "simulcast-react";
import { z } from "zod";

const MessageSchema = z.object({ text: z.string() });

export const Room: React.FunctionComponent = () => {
  const [text, setText] = useState("Waiting for a message");
  useChannel("rooms:design", (message) => setText(message.text), {
    parse: MessageSchema.parse,
  });
  return <p>{text}</p>;
};`,
  },
  {
    name: "Vue",
    install: "simulcast-vue",
    guide: "/vue",
    file: "Room.vue · script setup",
    code: `import { ref } from "vue";
import { useChannel } from "simulcast-vue";
import { z } from "zod";

const MessageSchema = z.object({ text: z.string() });
const text = ref("Waiting for a message");

useChannel("rooms:design", (message) => {
  text.value = message.text;
}, { parse: MessageSchema.parse });`,
  },
  {
    name: "Solid",
    install: "simulcast-solid",
    guide: "/solid",
    file: "Room.tsx",
    code: `import { createSignal } from "solid-js";
import type { Component } from "solid-js";
import { useChannel } from "simulcast-solid";
import { z } from "zod";

const MessageSchema = z.object({ text: z.string() });

export const Room: Component = () => {
  const [text, setText] = createSignal("Waiting for a message");
  useChannel("rooms:design", (message) => {
    setText(message.text);
  }, { parse: MessageSchema.parse });
  return <p>{text()}</p>;
};`,
  },
  {
    name: "Svelte",
    install: "simulcast-svelte",
    guide: "/svelte",
    file: "Room.svelte · script",
    code: `import { useChannel } from "simulcast-svelte";
import { z } from "zod";

const MessageSchema = z.object({ text: z.string() });
let text = $state("Waiting for a message");

useChannel("rooms:design", (message) => {
  text = message.text;
}, { parse: MessageSchema.parse });`,
  },
  {
    name: "TypeScript",
    install: "",
    guide: "/client",
    file: "listen.ts",
    code: `import { z } from "zod";
import { realtime } from "./realtime";

const MessageSchema = z.object({ text: z.string() });
const disconnect = realtime.connect();

const unsubscribe = realtime.channel("rooms:design")
  .subscribe((publication) => {
    const message = MessageSchema.parse(publication.data);
    console.log(message.text);
  });

// Call unsubscribe() and disconnect() when finished.`,
  },
] as const;
const selectedFramework = ref<(typeof frameworks)[number]>(frameworks[0]);
const installCommand = computed(() =>
  [
    "pnpm add simulcast",
    selectedFramework.value.install,
    "simulcast-broadcast-channel",
    "zod",
  ]
    .filter(Boolean)
    .join(" "),
);
const consumers = ref([
  { name: "Message list", active: true },
  { name: "Unread counter", active: true },
  { name: "Notification toast", active: false },
]);
const sessionEnabled = ref(true);
const demand = computed(
  () => consumers.value.filter((consumer) => consumer.active).length,
);
const hasSubscription = computed(
  () => sessionEnabled.value && demand.value > 0,
);
const explanation = computed(() => {
  if (!sessionEnabled.value)
    return "The session is off. Consumers keep their registrations, but there is no native subscription.";
  if (demand.value === 0)
    return "The last consumer left. Its native subscription is released; the connection session stays active.";
  if (demand.value === 1)
    return "The first consumer creates demand. One native subscription receives publications for this channel.";
  return `${demand.value} consumers share one native subscription. Removing one leaves the others listening.`;
});
const adapters = [
  {
    name: "Centrifugo",
    detail: "Channel subscriptions",
    anchor: "centrifugo",
    glyph: "Cf",
  },
  {
    name: "Pusher",
    detail: "Public, private, presence",
    anchor: "pusher-channels",
    glyph: "Pu",
  },
  { name: "Ably", detail: "Named channel events", anchor: "ably", glyph: "Ab" },
  {
    name: "Supabase",
    detail: "Realtime broadcasts",
    anchor: "supabase-realtime",
    glyph: "Su",
  },
  {
    name: "Socket.IO",
    detail: "Socket event names",
    anchor: "socket-io",
    glyph: "So",
  },
  {
    name: "Phoenix",
    detail: "Channel topics",
    anchor: "phoenix-channels",
    glyph: "Ph",
  },
  { name: "MQTT", detail: "Topics and wildcards", anchor: "mqtt", glyph: "Mq" },
  {
    name: "PartyKit",
    detail: "Room connections",
    anchor: "partykit",
    glyph: "Pk",
  },
  {
    name: "WebSocket",
    detail: "Your wire protocol",
    anchor: "generic-websocket",
    glyph: "Ws",
  },
  {
    name: "SSE",
    detail: "Server event streams",
    anchor: "server-sent-events",
    glyph: "Se",
  },
  {
    name: "BroadcastChannel",
    detail: "Same-origin messages",
    anchor: "broadcastchannel",
    glyph: "Bc",
  },
] as const;
const chapters = [
  {
    number: "01",
    title: "Receive your first message",
    detail: "A complete walkthrough with no server or account.",
    href: "/getting-started",
  },
  {
    number: "02",
    title: "Give your events a contract",
    detail: "Infer payloads from parsers and generate typed hooks.",
    href: "/typed-events",
  },
  {
    number: "03",
    title: "Own the connection lifetime",
    detail: "Handle account changes, disconnects, and cleanup.",
    href: "/sessions",
  },
  {
    number: "04",
    title: "Test the paths that fail",
    detail: "Drive failures deterministically, then test real transports.",
    href: "/integration-testing",
  },
] as const;
</script>

<template>
  <main class="simulcast-home">
    <section class="home-hero home-wrap" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="home-eyebrow">
          <span class="eyebrow-dot"></span> ONE RUNTIME. ELEVEN ADAPTERS.
        </p>
        <h1 id="home-title">
          Your app has<br />many listeners.<br /><span
            >Share the connection.</span
          >
        </h1>
        <p class="hero-description">
          Typed realtime subscriptions for React, Vue, Solid, Svelte, and
          TypeScript. One place to manage sessions, share channels, and clean
          up.
        </p>
        <div class="hero-actions">
          <a class="home-button primary" :href="withBase('/getting-started')"
            >Start without a server <span aria-hidden="true">↗</span></a
          >
          <a class="home-text-link" :href="withBase('/examples')"
            >Explore the examples <span aria-hidden="true">→</span></a
          >
        </div>
        <p class="hero-note">
          ESM + TypeScript declarations <span aria-hidden="true">·</span> MIT
          licensed
        </p>
      </div>
      <div class="hero-terminal" aria-label="Shared subscription example">
        <div class="terminal-top">
          <span class="terminal-dots" aria-hidden="true"
            ><i></i><i></i><i></i></span
          ><span>rooms:design</span><span class="terminal-badge">SHARED</span>
        </div>
        <div class="terminal-code">
          <span class="code-muted">// In each listening component</span
          ><br /><span class="code-function">useChannel</span>(<span
            class="code-string"
            >"rooms:design"</span
          >, onMessage);
        </div>
        <div class="terminal-consumers">
          <span>Message list</span><span>Unread counter</span
          ><span>Notifications</span>
        </div>
        <div class="terminal-route" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <div class="terminal-channel">
          <span class="signal-dot"></span><span>1 native subscription</span
          ><span class="code-muted">3 consumers</span>
        </div>
        <div class="terminal-bottom">
          <span>Last listener leaves</span
          ><span class="code-muted">subscription released ↗</span>
        </div>
      </div>
    </section>

    <div
      class="home-frameworks home-wrap"
      aria-label="Supported application frameworks"
    >
      <span>BUILT FOR YOUR STACK</span>
      <div>
        <span>React</span><span>Vue</span><span>Solid</span><span>Svelte</span
        ><span>React Native</span><span>TypeScript</span>
      </div>
    </div>

    <section
      class="inspector-section home-wrap"
      aria-labelledby="inspector-title"
    >
      <div class="home-section-heading">
        <div>
          <p class="home-eyebrow">OBSERVE THE WHOLE LIFECYCLE</p>
          <h2 id="inspector-title">
            See what happened.<br /><span class="home-muted"
              >Then follow the event.</span
            >
          </h2>
        </div>
        <div class="section-intro">
          <p>
            Connection state, shared channels, listener counts, and event
            history in one browser inspector. Opening it creates no subscription
            demand.
          </p>
          <a class="home-text-link" :href="withBase('/devtools')"
            >Meet the devtools <span aria-hidden="true">→</span></a
          >
        </div>
      </div>
      <figure class="inspector-frame">
        <div class="preview-bar">
          <span><span class="signal-dot"></span> MISSION CONTROL</span
          ><span>Actual example + Simulcast devtools</span>
        </div>
        <a
          :href="withBase('/devtools')"
          aria-label="Read the Simulcast devtools guide"
          ><img
            :src="withBase('/images/devtools.png')"
            alt="Mission Control dashboard with Simulcast devtools showing connection state, channel listeners, and an expanded event timeline."
            width="1440"
            height="960"
            fetchpriority="high"
        /></a>
        <figcaption>
          <span>Inspect channels. Filter events. Expand context.</span
          ><span>Payload capture is opt-in.</span>
        </figcaption>
      </figure>
      <div class="inspector-details">
        <div>
          <span class="detail-index">01 / CONNECTION</span>
          <h3>Know which session is active.</h3>
          <p>
            Inspect state transitions and follow a connection replacement when
            the account changes.
          </p>
        </div>
        <div>
          <span class="detail-index">02 / CHANNELS</span>
          <h3>See active listeners.</h3>
          <p>
            Distinguish publication consumers from passive status observers and
            spot subscription errors.
          </p>
        </div>
        <div>
          <span class="detail-index">03 / TIMELINE</span>
          <h3>Read the publication context.</h3>
          <p>
            Filter by channel or event kind, capture subsequent payloads, and
            copy bounded event details.
          </p>
        </div>
      </div>
    </section>

    <section class="model-section" aria-labelledby="model-title">
      <div class="home-wrap">
        <div class="home-section-heading">
          <div>
            <p class="home-eyebrow">SMALL CONTRACT. EXPLICIT OWNERSHIP.</p>
            <h2 id="model-title">
              Three consumers.<br /><span class="home-muted"
                >Still one subscription.</span
              >
            </h2>
          </div>
          <div class="section-intro">
            <p>
              Toggle the consumers below. The first listener creates demand; the
              last one releases it. Turn off the session to release its native
              resources.
            </p>
            <span class="model-label"
              >INTERACTIVE MODEL · NO NETWORK REQUESTS</span
            >
          </div>
        </div>
        <div class="ownership-model">
          <div class="model-header">
            <span>Channel <code>rooms:design</code></span
            ><button
              type="button"
              class="session-control"
              :aria-pressed="sessionEnabled"
              @click="sessionEnabled = !sessionEnabled"
            >
              <span :class="['status-light', { on: sessionEnabled }]"></span
              >Session {{ sessionEnabled ? "on" : "off"
              }}<span class="toggle-track"><span></span></span>
            </button>
          </div>
          <div class="model-flow">
            <div class="consumer-stack">
              <button
                v-for="consumer in consumers"
                :key="consumer.name"
                type="button"
                :class="['consumer-control', { active: consumer.active }]"
                :aria-pressed="consumer.active"
                @click="consumer.active = !consumer.active"
              >
                <span class="consumer-check" aria-hidden="true">{{
                  consumer.active ? "✓" : "+"
                }}</span
                ><span>{{ consumer.name }}</span
                ><span class="consumer-state">{{
                  consumer.active ? "listening" : "off"
                }}</span>
              </button>
            </div>
            <div :class="['model-channel', { live: hasSubscription }]">
              <span class="node-overline">SHARED CHANNEL</span
              ><code>rooms:design</code
              ><span class="node-status">{{
                hasSubscription ? "subscribed" : "detached"
              }}</span>
            </div>
            <div class="model-native">
              <strong>{{ hasSubscription ? "1" : "0" }}</strong
              ><span>native subscription{{ hasSubscription ? "" : "s" }}</span
              ><span class="native-count"
                >{{ demand }} registered consumer{{
                  demand === 1 ? "" : "s"
                }}</span
              >
            </div>
          </div>
          <p class="model-explanation" aria-live="polite">{{ explanation }}</p>
        </div>
        <p class="model-footnote">
          Status observers never create demand. Providers retain their own
          authentication, retry, and delivery semantics.
          <a :href="withBase('/client')">Read the client contract →</a>
        </p>
      </div>
    </section>

    <section class="code-section home-wrap" aria-labelledby="code-title">
      <div class="home-section-heading">
        <div>
          <p class="home-eyebrow">YOUR FRAMEWORK. YOUR PAYLOADS.</p>
          <h2 id="code-title">
            Your data, parsed.<br /><span class="home-muted"
              >Your hooks, typed.</span
            >
          </h2>
        </div>
        <div class="section-intro">
          <p>
            Use your framework's lifecycle. Infer payload types from a parser,
            or declare the event contract. Generated hooks are optional.
          </p>
          <a class="home-text-link" :href="withBase('/installation')"
            >Installation guide <span aria-hidden="true">→</span></a
          >
        </div>
      </div>
      <div class="framework-editor">
        <div class="framework-tabs" aria-label="Choose a framework">
          <button
            v-for="framework in frameworks"
            :key="framework.name"
            type="button"
            :aria-pressed="selectedFramework.name === framework.name"
            :class="{ selected: selectedFramework.name === framework.name }"
            @click="selectedFramework = framework"
          >
            {{ framework.name }}
          </button>
        </div>
        <div class="install-line">
          <span aria-hidden="true">$</span><code>{{ installCommand }}</code>
        </div>
        <div class="framework-code">
          <div class="file-label">
            <span>{{ selectedFramework.file }}</span
            ><span>TYPESCRIPT</span>
          </div>
          <pre><code>{{ selectedFramework.code }}</code></pre>
        </div>
        <div class="code-footer">
          <span
            >Framework snippets run inside a component beneath its
            provider.</span
          ><a :href="withBase(selectedFramework.guide)"
            >{{ selectedFramework.name }} guide →</a
          >
        </div>
      </div>
      <p class="code-footnote">
        The parser validates incoming data and determines the handler’s payload
        type. <a :href="withBase('/parsing')">Explore payload parsing →</a>
      </p>
    </section>

    <section
      class="adapters-section home-wrap"
      aria-labelledby="adapters-title"
    >
      <div class="home-section-heading">
        <div>
          <p class="home-eyebrow">CONNECT TO THE SERVER YOU USE</p>
          <h2 id="adapters-title">
            Use your provider.<br /><span class="home-muted"
              >Keep its capabilities.</span
            >
          </h2>
        </div>
        <div class="section-intro">
          <p>
            Share subscription ownership while keeping provider semantics
            explicit. Publishing, presence, history, and recovery remain SDK
            concerns.
          </p>
        </div>
      </div>
      <div class="adapter-grid">
        <a
          v-for="adapter in adapters"
          :key="adapter.name"
          :href="withBase(`/adapters#${adapter.anchor}`)"
          class="adapter-card"
          ><span class="adapter-glyph" aria-hidden="true">{{
            adapter.glyph
          }}</span>
          <div>
            <h3>{{ adapter.name }}</h3>
            <span>{{ adapter.detail }}</span>
          </div>
          <span class="adapter-arrow" aria-hidden="true">↗</span></a
        ><a
          :href="withBase('/writing-an-adapter')"
          class="adapter-card adapter-custom"
          ><span class="adapter-glyph" aria-hidden="true">+</span>
          <div>
            <h3>Your adapter</h3>
            <span>A small ownership contract</span>
          </div>
          <span class="adapter-arrow" aria-hidden="true">↗</span></a
        >
      </div>
      <p class="adapter-note">
        Local integration tests cover real SDKs and servers, with explicit
        hosted-service limits.
        <a :href="withBase('/integration-testing')">See what is tested →</a>
      </p>
    </section>

    <section class="example-showcase home-wrap" aria-labelledby="example-title">
      <div class="home-section-heading">
        <div>
          <p class="home-eyebrow">A WORKING APPLICATION IN FIVE FRAMEWORKS</p>
          <h2 id="example-title">
            Open Mission Control.<br /><span class="home-muted"
              >Follow a real implementation.</span
            >
          </h2>
        </div>
        <div class="section-intro">
          <p>
            Messages, metrics, alerts, and deployments share a typed event map.
            Run the dashboard in your framework, including Expo, with simulated
            traffic and no credentials.
          </p>
          <a class="home-text-link" :href="withBase('/examples')"
            >Run an example <span aria-hidden="true">→</span></a
          >
        </div>
      </div>
      <a class="example-image" :href="withBase('/examples')"
        ><img
          :src="withBase('/images/examples.png')"
          alt="Mission Control example dashboard showing messages, active users, alerts, and deployment updates from simulated realtime events."
          width="1440"
          height="960"
          loading="lazy"
      /></a>
    </section>

    <section class="learn-section home-wrap" aria-labelledby="learn-title">
      <div class="learn-intro">
        <p class="home-eyebrow">FROM FIRST MESSAGE TO REAL APPLICATION</p>
        <h2 id="learn-title">
          Guides and<br /><span class="home-muted">working examples.</span>
        </h2>
        <p>
          Follow a focused guide, or open Mission Control in your framework and
          trace a working implementation.
        </p>
        <a class="home-button secondary" :href="withBase('/examples')"
          >Run the examples <span aria-hidden="true">↗</span></a
        >
      </div>
      <div class="chapter-list">
        <a
          v-for="chapter in chapters"
          :key="chapter.number"
          :href="withBase(chapter.href)"
          ><span class="chapter-number">{{ chapter.number }}</span>
          <div>
            <h3>{{ chapter.title }}</h3>
            <p>{{ chapter.detail }}</p>
          </div>
          <span aria-hidden="true">↗</span></a
        >
      </div>
    </section>

    <section class="home-closing home-wrap">
      <img
        :src="withBase('/images/brand-mark.svg')"
        width="48"
        height="48"
        alt=""
      />
      <h2>Start with one message.</h2>
      <p>No server or credentials needed for the first walkthrough.</p>
      <a class="home-button primary" :href="withBase('/getting-started')"
        >Get started <span aria-hidden="true">→</span></a
      >
    </section>
  </main>
</template>
