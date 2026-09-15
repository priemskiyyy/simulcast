<script lang="ts">
  import clsx from "clsx";
  import { sessionButtonStyles } from "example-shared/styles/sessionButtonStyles";
  import type { RealtimeSource } from "example-shared";
  import { Planet } from "phosphor-svelte";
  import ConnectionBadge from "src/components/ConnectionBadge.svelte";
  import SourceSwitch from "src/components/SourceSwitch.svelte";

  type HeaderProps = {
    sourceType: RealtimeSource["type"];
    endpoint: string;
    roomId: string;
    enabled: boolean;
    onSessionToggle: () => void;
  };

  let {
    sourceType = $bindable(),
    endpoint = $bindable(),
    roomId = $bindable(),
    enabled,
    onSessionToggle,
  }: HeaderProps = $props();

  const FIELD_CLASS =
    "h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";
</script>

<header
  class="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70"
>
  <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
    <div class="mr-auto flex items-center gap-2">
      <Planet
        size={24}
        weight="duotone"
        class="text-emerald-600 dark:text-emerald-400"
      />
      <h1 class="text-base font-semibold">Mission Control</h1>
      <ConnectionBadge />
    </div>
    <SourceSwitch bind:sourceType />
    {#if sourceType === "CENTRIFUGO"}
      <label class="flex items-center gap-2 text-sm">
        <span class="sr-only">WebSocket endpoint</span>
        <input
          bind:value={endpoint}
          aria-label="WebSocket endpoint"
          class={clsx(FIELD_CLASS, "w-72 font-mono text-xs")}
          disabled={enabled}
        />
      </label>
    {/if}
    <label class="flex items-center gap-2 text-sm">
      Room
      <input
        bind:value={roomId}
        aria-label="Room"
        class={clsx(FIELD_CLASS, "w-28")}
      />
    </label>
    <button
      type="button"
      class={sessionButtonStyles({ enabled: enabled })}
      onclick={onSessionToggle}
    >
      {enabled ? "Disconnect" : "Connect"}
    </button>
  </div>
</header>
