import type { Component } from "solid-js";
import { deployProgressStyles } from "example-shared/styles/deployProgressStyles";
import { DEPLOY_STAGES, formatStage, getStageIndex } from "example-shared";
import type { Deploy, DeployStage } from "example-shared";
import { Rocket } from "lucide-solid";
import { For, Show } from "solid-js";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";

type DeploysPanelProps = {
  deploys: Deploy[];
};

export const DeploysPanel: Component<DeploysPanelProps> = (props) => (
  <Panel title="Deploys" icon={Rocket}>
    <Show
      when={props.deploys.length > 0}
      fallback={
        <EmptyState
          icon={Rocket}
          title="Nothing shipping"
          description="deploy.progressed publications move each service through the pipeline."
        />
      }
    >
      <ul class="flex flex-col gap-4">
        <For each={props.deploys}>
          {(deploy) => (
            <li>
              <DeployPipeline deploy={deploy} />
            </li>
          )}
        </For>
      </ul>
    </Show>
  </Panel>
);

type DeployPipelineProps = {
  deploy: Deploy;
};

const DeployPipeline: Component<DeployPipelineProps> = (props) => {
  const currentIndex = () => getStageIndex(props.deploy.stage);
  const isDone = (stage: DeployStage) =>
    getStageIndex(stage) < currentIndex() || props.deploy.stage === "LIVE";
  const widthFor = (stage: DeployStage) => {
    if (isDone(stage)) {
      return 100;
    }

    if (stage === props.deploy.stage) {
      return props.deploy.percent;
    }

    return 0;
  };

  return (
    <div>
      <p class="mb-2 flex items-baseline justify-between text-sm">
        <span class="font-mono font-medium">{props.deploy.service}</span>
        <span class="text-xs text-zinc-500 dark:text-zinc-400">
          {formatStage(props.deploy.stage)} · {props.deploy.percent}%
        </span>
      </p>
      <ol
        class="grid grid-cols-4 gap-1.5"
        aria-label={`${props.deploy.service} pipeline`}
      >
        <For each={DEPLOY_STAGES}>
          {(stage) => (
            <li
              aria-current={stage === props.deploy.stage ? "step" : undefined}
            >
              <div class="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  class={deployProgressStyles({ done: isDone(stage) })}
                  style={{ width: `${widthFor(stage)}%` }}
                />
              </div>
              <span class="mt-1 block text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {formatStage(stage)}
              </span>
            </li>
          )}
        </For>
      </ol>
    </div>
  );
};
