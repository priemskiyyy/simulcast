import type { RealtimeSnapshot } from "@priemskiyyy/simulcast";
import { SimulcastIcon } from "src/components/SimulcastIcon";
import type { PanelPosition } from "src/types/PanelPosition";

type PanelHeaderProps = {
  snapshot: RealtimeSnapshot;
  position: PanelPosition;
  onDock: () => void;
  onClose: () => void;
};

export const PanelHeader = (props: PanelHeaderProps) => (
  <header class="header">
    <SimulcastIcon />
    <strong>Simulcast</strong>
    <span class="label">{props.snapshot.adapter}</span>
    <code class="session" title="Session">
      {props.snapshot.session === null
        ? "no session"
        : `session ${props.snapshot.session.id}`}
    </code>
    <span class="connection" data-state={props.snapshot.connection}>
      <span class="dot" data-state={props.snapshot.connection} />
      {props.snapshot.connection}
    </span>
    <button
      type="button"
      class="icon-button"
      aria-label={
        props.position === "bottom" ? "Dock to the right" : "Dock to the bottom"
      }
      onClick={() => props.onDock()}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <rect
          x="1.5"
          y="1.5"
          width="11"
          height="11"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.4"
        />
        {props.position === "bottom" ? (
          <rect
            x="8"
            y="1.5"
            width="4.5"
            height="11"
            rx="1"
            fill="currentColor"
          />
        ) : (
          <rect
            x="1.5"
            y="8"
            width="11"
            height="4.5"
            rx="1"
            fill="currentColor"
          />
        )}
      </svg>
    </button>
    <button
      type="button"
      class="icon-button"
      aria-label="Close devtools"
      onClick={() => props.onClose()}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        <path
          d="M3 3l8 8M11 3l-8 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </header>
);
