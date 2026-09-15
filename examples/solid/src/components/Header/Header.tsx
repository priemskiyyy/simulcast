import type { Component } from "solid-js";
import { sessionButtonStyles } from "example-shared/styles/sessionButtonStyles";
import clsx from "clsx";
import type { RealtimeSource } from "example-shared";
import { Orbit } from "lucide-solid";
import { Show } from "solid-js";
import { ConnectionBadge } from "src/components/ConnectionBadge/ConnectionBadge";
import { SourceSwitch } from "src/components/Header/SourceSwitch";
import type { ApplicationState } from "example-shared";

type HeaderProps = {
  state: ApplicationState;
  onSourceSelect: (sourceType: RealtimeSource["type"]) => void;
  onEndpointChange: (endpoint: string) => void;
  onRoomChange: (roomId: string) => void;
  onSessionToggle: () => void;
};

const FIELD_CLASS_NAME =
  "h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900";

export const Header: Component<HeaderProps> = (props) => (
  <header class="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
      <div class="mr-auto flex items-center gap-2">
        <Orbit size={24} class="text-emerald-600 dark:text-emerald-400" />
        <h1 class="text-base font-semibold">Mission Control</h1>
        <ConnectionBadge />
      </div>
      <SourceSwitch
        value={props.state.sourceType}
        onChange={props.onSourceSelect}
      />
      <Show when={props.state.sourceType === "CENTRIFUGO"}>
        <label class="flex items-center gap-2 text-sm">
          <span class="sr-only">WebSocket endpoint</span>
          <input
            aria-label="WebSocket endpoint"
            class={clsx(FIELD_CLASS_NAME, "w-72 font-mono text-xs")}
            value={props.state.endpoint}
            disabled={props.state.enabled}
            onInput={(event) =>
              props.onEndpointChange(event.currentTarget.value)
            }
          />
        </label>
      </Show>
      <label class="flex items-center gap-2 text-sm">
        Room
        <input
          aria-label="Room"
          class={clsx(FIELD_CLASS_NAME, "w-28")}
          value={props.state.roomId}
          onInput={(event) => props.onRoomChange(event.currentTarget.value)}
        />
      </label>
      <button
        type="button"
        onClick={() => props.onSessionToggle()}
        class={sessionButtonStyles({ enabled: props.state.enabled })}
      >
        {props.state.enabled ? "Disconnect" : "Connect"}
      </button>
    </div>
  </header>
);
