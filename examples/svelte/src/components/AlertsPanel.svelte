<script lang="ts">
  import AlertRow from "src/components/AlertRow.svelte";
  import type { Alert } from "example-shared";
  import { Bell, ShieldCheck } from "phosphor-svelte";
  import { useNow } from "src/utilities/useNow.svelte";
  import Badge from "src/components/Badge.svelte";
  import EmptyState from "src/components/EmptyState.svelte";
  import Panel from "src/components/Panel.svelte";

  type AlertsPanelProps = { alerts: Alert[] };

  let { alerts }: AlertsPanelProps = $props();
  const now = useNow(15_000);
</script>

<Panel title="Alerts" icon={Bell}>
  {#snippet aside()}
    <Badge tone={alerts.length > 0 ? "warning" : "positive"}
      >{alerts.length} open</Badge
    >
  {/snippet}
  {#if alerts.length === 0}
    <EmptyState
      icon={ShieldCheck}
      title="All clear"
      description="alert.raised publications stay here until alert.resolved arrives."
    />
  {:else}
    <ul class="flex flex-col gap-2">
      {#each alerts as alert (alert.id)}
        <AlertRow {alert} now={now.current} />
      {/each}
    </ul>
  {/if}
</Panel>
