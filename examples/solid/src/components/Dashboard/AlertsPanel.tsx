import type { Component } from "solid-js";
import { Info, Siren, TriangleAlert, Bell, ShieldCheck } from "lucide-solid";
import { createMemo, For, Show } from "solid-js";
import {
  formatRelativeTime,
  formatSeverity,
  getSeverityTone,
} from "example-shared";
import type { Alert } from "example-shared";
import { match } from "ts-pattern";
import { Badge } from "src/components/Badge/Badge";
import { EmptyState } from "src/components/EmptyState/EmptyState";
import { Panel } from "src/components/Panel/Panel";
import { useNow } from "src/primitives/useNow";

type AlertRowProps = { alert: Alert; now: number };
const AlertRow: Component<AlertRowProps> = (props) => {
  const icon = createMemo(() =>
    match(props.alert.severity)
      .with("INFO", () => Info)
      .with("WARNING", () => TriangleAlert)
      .with("CRITICAL", () => Siren)
      .exhaustive(),
  );
  return (
    <li class="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <Badge tone={getSeverityTone(props.alert.severity)} icon={icon()}>
        {formatSeverity(props.alert.severity)}
      </Badge>
      <span class="min-w-0 flex-1 truncate text-sm" title={props.alert.text}>
        {props.alert.text}
      </span>
      <time
        dateTime={props.alert.raisedAt}
        class="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
      >
        {formatRelativeTime(props.alert.raisedAt, props.now)}
      </time>
    </li>
  );
};

type AlertsPanelProps = {
  alerts: Alert[];
};

export const AlertsPanel: Component<AlertsPanelProps> = (props) => {
  const now = useNow(15_000);

  return (
    <Panel
      title="Alerts"
      icon={Bell}
      aside={
        <Badge tone={props.alerts.length > 0 ? "warning" : "positive"}>
          {props.alerts.length} open
        </Badge>
      }
    >
      <Show
        when={props.alerts.length > 0}
        fallback={
          <EmptyState
            icon={ShieldCheck}
            title="All clear"
            description="alert.raised publications stay here until alert.resolved arrives."
          />
        }
      >
        <ul class="flex flex-col gap-2">
          <For each={props.alerts}>
            {(alert) => <AlertRow alert={alert} now={now()} />}
          </For>
        </ul>
      </Show>
    </Panel>
  );
};
