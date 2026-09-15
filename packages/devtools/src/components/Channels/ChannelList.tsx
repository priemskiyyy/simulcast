import { Index, Show } from "solid-js";
import type { RealtimeSnapshot } from "@priemskiyyy/simulcast";
import { formatCount } from "src/formatting/formatCount";
import { formatErrorSummary } from "src/formatting/formatErrorSummary";

type ChannelListProps = {
  channels: RealtimeSnapshot["channels"];
  selectedChannel: string | null;
  onSelect: (channel: string | null) => void;
};

export const ChannelList = (props: ChannelListProps) => (
  <nav class="channels" aria-label="Realtime channels">
    <button
      type="button"
      class="channel"
      aria-pressed={props.selectedChannel === null}
      onClick={() => props.onSelect(null)}
    >
      <span class="channel-name">All channels</span>
      <span class="count">{props.channels.length}</span>
    </button>
    <Index each={props.channels}>
      {(channel) => (
        <button
          type="button"
          class="channel"
          aria-pressed={props.selectedChannel === channel().name}
          onClick={() => props.onSelect(channel().name)}
        >
          <span class="channel-name">
            <span class="dot" data-state={channel().state} />
            {channel().name}
          </span>
          <small>
            {channel().state} ·{" "}
            {formatCount(
              channel().consumers.publications,
              "publication listener",
            )}{" "}
            · {formatCount(channel().consumers.status, "status observer")}
          </small>
          <Show when={channel().error}>
            {(error) => (
              <small class="error">{formatErrorSummary(error().error)}</small>
            )}
          </Show>
        </button>
      )}
    </Index>
    <Show when={props.channels.length === 0}>
      <p class="channel-empty">No channel listeners yet.</p>
    </Show>
  </nav>
);
