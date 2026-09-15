<script setup lang="ts">
import { PhChatsCircle, PhUsers } from "@phosphor-icons/vue";
import { formatRelativeTime } from "example-shared";
import type { Message } from "example-shared";
import Badge from "src/components/Badge.vue";
import EmptyState from "src/components/EmptyState.vue";
import Panel from "src/components/Panel.vue";
import { useNow } from "src/composables/useNow";

type MessagesPanelProps = {
  roomId: string;
  messages: Message[];
  online: number;
};

defineProps<MessagesPanelProps>();
const now = useNow(15_000);
</script>

<template>
  <Panel :title="`rooms:${roomId}`" :icon="PhChatsCircle">
    <template #aside>
      <Badge tone="neutral" :icon="PhUsers">{{ online }} online</Badge>
    </template>
    <EmptyState
      v-if="messages.length === 0"
      :icon="PhChatsCircle"
      title="No messages yet"
      description="message.created publications on this room appear here, newest first."
    />
    <ol v-else class="flex flex-col gap-3 overflow-auto">
      <li v-for="message in messages" :key="message.id" class="flex gap-3">
        <span
          aria-hidden="true"
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
        >
          {{ message.author.slice(0, 1) }}
        </span>
        <div class="min-w-0">
          <p class="flex items-baseline gap-2 text-sm">
            <span class="font-medium">{{ message.author }}</span>
            <time
              :datetime="message.sentAt"
              class="text-xs text-zinc-500 dark:text-zinc-400"
            >
              {{ formatRelativeTime(message.sentAt, now) }}
            </time>
          </p>
          <p class="text-sm text-zinc-700 dark:text-zinc-300">
            {{ message.text }}
          </p>
        </div>
      </li>
    </ol>
  </Panel>
</template>
