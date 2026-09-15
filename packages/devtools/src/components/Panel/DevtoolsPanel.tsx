import type { RealtimeSnapshot } from "simulcast";
import { ChannelList } from "src/components/Channels/ChannelList";
import { PanelHeader } from "src/components/Panel/PanelHeader";
import { ResizeHandle } from "src/components/Panel/ResizeHandle";
import { Timeline } from "src/components/Timeline/Timeline";
import { useAutoFocus } from "src/hooks/useAutoFocus";
import { useEventFilters } from "src/hooks/useEventFilters";
import type { PanelPosition } from "src/types/PanelPosition";
import type { DevtoolsState } from "src/utils/devtoolsState";
import type { RecordedEvent } from "src/utils/EventLog";

type DevtoolsPanelProps = {
  snapshot: RealtimeSnapshot;
  events: RecordedEvent[];
  recording: DevtoolsState["recording"];
  /** False when the panel opened from stored preferences, so mounting never steals focus. */
  autoFocus: boolean;
  position: PanelPosition;
  /** Height when docked to the bottom, width when docked to the right. */
  size: number;
  onSizeChange: (size: number) => void;
  onDock: () => void;
  onTogglePause: () => void;
  onCapturePayloadsChange: (enabled: boolean) => void;
  onClear: () => void;
  onClose: () => void;
};

export const DevtoolsPanel = (props: DevtoolsPanelProps) => {
  const focusOnMount = useAutoFocus(props.autoFocus);
  const filters = useEventFilters(() => props.events);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") {
      return;
    }

    event.stopPropagation();
    props.onClose();
  };

  return (
    <aside
      ref={focusOnMount}
      tabIndex={-1}
      class="panel"
      data-position={props.position}
      aria-label="Simulcast devtools"
      style={
        props.position === "bottom"
          ? { height: `${props.size}px` }
          : { width: `${props.size}px` }
      }
      onKeyDown={handleKeyDown}
    >
      <ResizeHandle
        position={props.position}
        size={props.size}
        onSizeChange={(size) => props.onSizeChange(size)}
      />
      <PanelHeader
        snapshot={props.snapshot}
        position={props.position}
        onDock={() => props.onDock()}
        onClose={() => props.onClose()}
      />
      <div class="body">
        <ChannelList
          channels={props.snapshot.channels}
          selectedChannel={filters.filters().channel}
          onSelect={(channel) => filters.update({ channel })}
        />
        <Timeline
          events={props.events}
          recording={props.recording}
          filters={filters}
          onTogglePause={() => props.onTogglePause()}
          onCapturePayloadsChange={(enabled) =>
            props.onCapturePayloadsChange(enabled)
          }
          onClear={() => props.onClear()}
        >
          <Timeline.Toolbar />
          <Timeline.Kinds />
          <Timeline.Rows emptyState={<Timeline.Empty />} />
        </Timeline>
      </div>
    </aside>
  );
};
