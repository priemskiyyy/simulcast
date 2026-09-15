<script lang="ts">
  import { formatRelativeTime } from "example-shared";
  import type { Message } from "example-shared";
  import { ChatsCircle, Users } from "phosphor-svelte";
  import Badge from "src/components/Badge.svelte";
  import EmptyState from "src/components/EmptyState.svelte";
  import Panel from "src/components/Panel.svelte";
  import { useNow } from "src/utilities/useNow.svelte";

  type MessagesPanelProps = {
    roomId: string;
    messages: Message[];
    online: number;
  };

  let { roomId, messages, online }: MessagesPanelProps = $props();
  const now = useNow(15_000);
</script>

<Panel title={`rooms:${roomId}`} icon={ChatsCircle}>
  {#snippet aside()}
    <Badge tone="neutral" icon={Users}>{online} online</Badge>
  {/snippet}
  {#if messages.length === 0}
    <EmptyState
      icon={ChatsCircle}
      title="No messages yet"
      description="message.created publications on this room appear here, newest first."
    />
  {:else}
    <ol class="flex flex-col gap-3 overflow-auto">
      {#each messages as message (message.id)}
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
                datetime={message.sentAt}
                class="text-xs text-zinc-500 dark:text-zinc-400"
              >
                {formatRelativeTime(message.sentAt, now.current)}
              </time>
            </p>
            <p class="text-sm text-zinc-700 dark:text-zinc-300">
              {message.text}
            </p>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</Panel>
