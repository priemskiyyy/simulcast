import { useResize } from "src/hooks/useResize";
import type { PanelPosition } from "src/types/PanelPosition";

type ResizeHandleProps = {
  position: PanelPosition;
  size: number;
  onSizeChange: (size: number) => void;
};

/** The panel's free edge: drag it, or focus it and use the arrow keys. */
export const ResizeHandle = (props: ResizeHandleProps) => {
  const { handlePointerDown, handleKeyDown } = useResize({
    position: () => props.position,
    size: () => props.size,
    onSizeChange: (size) => props.onSizeChange(size),
  });

  return (
    <div
      class="resize"
      data-position={props.position}
      role="separator"
      aria-orientation={props.position === "bottom" ? "horizontal" : "vertical"}
      aria-label="Resize devtools"
      aria-valuenow={props.size}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    />
  );
};
