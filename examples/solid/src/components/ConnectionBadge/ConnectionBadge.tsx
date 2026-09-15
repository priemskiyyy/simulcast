import type { Component } from "solid-js";
import { formatConnectionState, getConnectionTone } from "example-shared";
import { LoaderCircle, Plug, PlugZap } from "lucide-solid";
import { useConnectionState } from "simulcast-solid";
import { match } from "ts-pattern";
import { Badge } from "src/components/Badge/Badge";

export const ConnectionBadge: Component = () => {
  const connection = useConnectionState();
  const icon = () =>
    match(connection())
      .with("connected", () => PlugZap)
      .with("connecting", () => LoaderCircle)
      .with("disconnected", () => Plug)
      .exhaustive();

  return (
    <Badge tone={getConnectionTone(connection())} icon={icon()}>
      {formatConnectionState(connection())}
    </Badge>
  );
};
