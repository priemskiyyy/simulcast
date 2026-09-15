import type { RealtimeSnapshot } from "@priemskiyyy/simulcast";
import { SimulcastIcon } from "src/components/SimulcastIcon";
import { useAutoFocus } from "src/hooks/useAutoFocus";

type LauncherProps = {
  connection: RealtimeSnapshot["connection"];
  hasUnseenError: boolean;
  autoFocus: boolean;
  onOpen: () => void;
};

export const Launcher = (props: LauncherProps) => {
  const focusOnMount = useAutoFocus(props.autoFocus);

  return (
    <button
      ref={focusOnMount}
      type="button"
      class="launcher"
      aria-label="Open Simulcast devtools"
      onClick={() => props.onOpen()}
    >
      <SimulcastIcon />
      <span>Realtime</span>
      <span
        class="dot"
        data-state={props.hasUnseenError ? "error" : props.connection}
      />
    </button>
  );
};
