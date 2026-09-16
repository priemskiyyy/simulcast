import type React from "react";
import { Broadcast, MinusCircle, PlusCircle } from "@phosphor-icons/react";
import { messageSchema } from "example-shared";
import { simulationButtonStyles } from "example-shared/styles/simulationButtonStyles";
import { useState, useSyncExternalStore } from "react";
import {
  useChannelStatus,
  useRealtimeClient,
} from "@priemskiyyy/simulcast-react";
import { Badge } from "src/components/Badge/Badge";
import { Panel } from "src/components/Panel/Panel";
import { useMessageCreated } from "src/hooks/generated/useMessageCreated";

type SharedSubscriptionPanelProps = {
  roomId: string;
  dashboardMounted: boolean;
  onDashboardToggle: () => void;
};

/**
 * Shows the ownership model: every listener on the room shares one native
 * subscription, and the channel detaches only after the last listener leaves.
 * The listener count comes from the same diagnostics devtools reads.
 */
export const SharedSubscriptionPanel: React.FunctionComponent<
  SharedSubscriptionPanelProps
> = ({ roomId, dashboardMounted, onDashboardToggle }) => {
  const channel = `rooms:${roomId}`;
  const [listeners, setListeners] = useState(1);
  const status = useChannelStatus(channel);
  const publicationListeners = usePublicationListeners(channel);
  const isSubscribed = status.state === "subscribed";

  return (
    <Panel
      title="Shared subscription"
      icon={Broadcast}
      aside={
        <Badge tone={isSubscribed ? "positive" : "neutral"}>
          {status.state}
        </Badge>
      }
    >
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Every listener on <code>{channel}</code> shares one native subscription.
        Add listeners, unmount the dashboard, and follow the channel in
        devtools.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={dashboardMounted}
          onChange={onDashboardToggle}
          className="accent-emerald-600"
        />
        Dashboard panels
      </label>
      <ol className="my-4 flex flex-col gap-2">
        {Array.from({ length: listeners }, (_, index) => (
          <RoomListener key={index} index={index + 1} roomId={roomId} />
        ))}
      </ol>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setListeners((current) => current + 1)}
          className={simulationButtonStyles()}
        >
          <PlusCircle size={14} weight="bold" />
          Add listener
        </button>
        <button
          type="button"
          disabled={listeners === 0}
          onClick={() => setListeners((current) => Math.max(0, current - 1))}
          className={simulationButtonStyles()}
        >
          <MinusCircle size={14} weight="bold" />
          Remove listener
        </button>
        <p className="ml-auto text-sm text-zinc-600 dark:text-zinc-400">
          {publicationListeners}{" "}
          {publicationListeners === 1 ? "listener" : "listeners"} ·{" "}
          {status.state === "detached"
            ? "no native subscription"
            : "one native subscription"}
        </p>
      </div>
    </Panel>
  );
};

/** Publication listener count for one channel, read from the client's diagnostics snapshot. */
const usePublicationListeners = (channel: string) => {
  const { diagnostics } = useRealtimeClient();

  return useSyncExternalStore(
    diagnostics.subscribe,
    () => {
      const entry = diagnostics
        .get()
        .channels.find((candidate) => candidate.name === channel);

      return entry === undefined ? 0 : entry.consumers.publications;
    },
    () => 0,
  );
};

type RoomListenerProps = {
  index: number;
  roomId: string;
};

const RoomListener: React.FunctionComponent<RoomListenerProps> = ({
  index,
  roomId,
}) => {
  const [received, setReceived] = useState(0);

  useMessageCreated(
    `rooms:${roomId}`,
    () => setReceived((current) => current + 1),
    { parse: messageSchema.parse },
  );

  return (
    <li className="flex items-center justify-between rounded-lg border border-zinc-200/80 px-3 py-2 text-sm dark:border-zinc-800">
      <span>Listener {index}</span>
      <span className="text-zinc-500 dark:text-zinc-400">
        {received} received
      </span>
    </li>
  );
};
