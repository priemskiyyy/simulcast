<script lang="ts">
  import type { Deploy } from "example-shared";
  import { RocketLaunch } from "phosphor-svelte";
  import DeployPipeline from "src/components/DeployPipeline.svelte";
  import EmptyState from "src/components/EmptyState.svelte";
  import Panel from "src/components/Panel.svelte";

  type DeploysPanelProps = { deploys: Deploy[] };

  let { deploys }: DeploysPanelProps = $props();
</script>

<Panel title="Deploys" icon={RocketLaunch}>
  {#if deploys.length === 0}
    <EmptyState
      icon={RocketLaunch}
      title="Nothing shipping"
      description="deploy.progressed publications move each service through the pipeline."
    />
  {:else}
    <ul class="flex flex-col gap-4">
      {#each deploys as deploy (deploy.service)}
        <li><DeployPipeline {deploy} /></li>
      {/each}
    </ul>
  {/if}
</Panel>
