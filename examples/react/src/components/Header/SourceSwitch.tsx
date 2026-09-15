import type React from "react";
import { sourceButtonStyles } from "example-shared/styles/sourceButtonStyles";
import { Broadcast, Cpu } from "@phosphor-icons/react";
import type { RealtimeSource } from "example-shared";

type SourceSwitchProps = {
  value: RealtimeSource["type"];
  onChange: (sourceType: RealtimeSource["type"]) => void;
};

const OPTIONS = [
  { type: "SIMULATION", label: "Simulation", icon: Cpu },
  { type: "CENTRIFUGO", label: "Centrifugo", icon: Broadcast },
] as const;

export const SourceSwitch: React.FunctionComponent<SourceSwitchProps> = ({
  value,
  onChange,
}) => (
  <div
    role="group"
    aria-label="Realtime source"
    className="inline-flex rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800"
  >
    {OPTIONS.map(({ type, label, icon: OptionIcon }) => (
      <button
        key={type}
        type="button"
        aria-pressed={value === type}
        onClick={() => onChange(type)}
        className={sourceButtonStyles({ selected: value === type })}
      >
        <OptionIcon size={14} weight="bold" />
        {label}
      </button>
    ))}
  </div>
);
