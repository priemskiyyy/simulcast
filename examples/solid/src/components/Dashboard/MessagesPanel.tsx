import type { Component } from "solid-js";
import { formatRelativeTime } from "example-shared";
import type { Message } from "example-shared";
import { MessagesSquare, Users } from "lucide-solid";
import { For, Show } from "solid-js";
import { Badge } from "src/components/Badge/Badge";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { useNow } from "src/primitives/useNow";

type MessagesPanelProps = {
  roomId: string;
  messages: Message[];
  online: number;
};

export const MessagesPanel: Component<MessagesPanelProps> = (props) => {
  const now = useNow(15_000);

  return (
    <Panel
      title={`rooms:${props.roomId}`}
      icon={MessagesSquare}
      aside={
        <Badge tone="neutral" icon={Users}>
          {props.online} online
        </Badge>
      }
    >
      <Show
        when={props.messages.length > 0}
        fallback={
          <EmptyState
            icon={MessagesSquare}
            title="No messages yet"
            description="message.created publications on this room appear here, newest first."
          />
        }
      >
        <ol class="flex flex-col gap-3 overflow-auto">
          <For each={props.messages}>
            {(message) => (
              <li class="flex gap-3">
                <span
                  aria-hidden="true"
                  class="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                >
                  {message.author.slice(0, 1)}
                </span>
                <div class="min-w-0">
                  <p class="flex items-baseline gap-2 text-sm">
                    <span class="font-medium">{message.author}</span>
                    <time
                      dateTime={message.sentAt}
                      class="text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      {formatRelativeTime(message.sentAt, now())}
                    </time>
                  </p>
                  <p class="text-sm text-zinc-700 dark:text-zinc-300">
                    {message.text}
                  </p>
                </div>
              </li>
            )}
          </For>
        </ol>
      </Show>
    </Panel>
  );
};
