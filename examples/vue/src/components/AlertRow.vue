<script setup lang="ts">
import { PhInfo, PhSiren, PhWarning } from "@phosphor-icons/vue";
import { computed } from "vue";
import { match } from "ts-pattern";
import {
  formatRelativeTime,
  formatSeverity,
  getSeverityTone,
} from "example-shared";
import type { Alert } from "example-shared";
import Badge from "src/components/Badge.vue";

type AlertRowProps = { alert: Alert; now: number };
const props = defineProps<AlertRowProps>();
const icon = computed(() =>
  match(props.alert.severity)
    .with("INFO", () => PhInfo)
    .with("WARNING", () => PhWarning)
    .with("CRITICAL", () => PhSiren)
    .exhaustive(),
);
</script>
<template>
  <li
    class="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
  >
    <Badge :tone="getSeverityTone(alert.severity)" :icon="icon">{{
      formatSeverity(alert.severity)
    }}</Badge>
    <span class="min-w-0 flex-1 truncate text-sm" :title="alert.text">{{
      alert.text
    }}</span>
    <time
      :datetime="alert.raisedAt"
      class="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
      >{{ formatRelativeTime(alert.raisedAt, now) }}</time
    >
  </li>
</template>
