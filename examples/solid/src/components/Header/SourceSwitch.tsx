import type { Component } from "solid-js";
import { sourceButtonStyles } from "example-shared/styles/sourceButtonStyles";
import type { RealtimeSource } from "example-shared";
import { Cpu, Radio } from "lucide-solid";
import { For } from "solid-js";
import { Dynamic } from "solid-js/web";

type SourceSwitchProps = {
  value: RealtimeSource["type"];
  onChange: (sourceType: RealtimeSource["type"]) => void;
};

const OPTIONS = [
  { type: "SIMULATION", label: "Simulation", icon: Cpu },
  { type: "CENTRIFUGO", label: "Centrifugo", icon: Radio },
] as const;

export const SourceSwitch: Component<SourceSwitchProps> = (props) => (
  <div
    role="group"
    aria-label="Realtime source"
    class="inline-flex rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800"
  >
    <For each={OPTIONS}>
      {(option) => (
        <button
          type="button"
          aria-pressed={props.value === option.type}
          onClick={() => props.onChange(option.type)}
          class={sourceButtonStyles({ selected: props.value === option.type })}
        >
          <Dynamic component={option.icon} size={14} stroke-width={2.5} />
          {option.label}
        </button>
      )}
    </For>
  </div>
);
