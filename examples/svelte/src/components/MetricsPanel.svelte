<script lang="ts">
  import { METRIC_NAMES } from "example-shared";
  import type { DashboardState } from "example-shared";
  import { Gauge } from "phosphor-svelte";
  import MetricCard from "src/components/MetricCard.svelte";
  import Panel from "src/components/Panel.svelte";

  type MetricsPanelProps = { metrics: DashboardState["metrics"] };

  let { metrics }: MetricsPanelProps = $props();
</script>

<Panel title="Metrics" icon={Gauge}>
  <div class="grid gap-3 sm:grid-cols-3">
    {#each METRIC_NAMES as name (name)}
      <MetricCard {name} reading={metrics[name]} />
    {/each}
  </div>
</Panel>
