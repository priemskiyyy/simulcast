<script lang="ts">
  import { Info, Siren, Warning } from "phosphor-svelte";
  import { match } from "ts-pattern";
  import {
    formatRelativeTime,
    formatSeverity,
    getSeverityTone,
  } from "example-shared";
  import type { Alert } from "example-shared";
  import Badge from "src/components/Badge.svelte";

  type AlertRowProps = { alert: Alert; now: number };
  let { alert, now }: AlertRowProps = $props();
  const icon = $derived(
    match(alert.severity)
      .with("INFO", () => Info)
      .with("WARNING", () => Warning)
      .with("CRITICAL", () => Siren)
      .exhaustive(),
  );
</script>

<li
  class="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800"
>
  <Badge tone={getSeverityTone(alert.severity)} {icon}
    >{formatSeverity(alert.severity)}</Badge
  >
  <span class="min-w-0 flex-1 truncate text-sm" title={alert.text}
    >{alert.text}</span
  >
  <time
    datetime={alert.raisedAt}
    class="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
    >{formatRelativeTime(alert.raisedAt, now)}</time
  >
</li>
