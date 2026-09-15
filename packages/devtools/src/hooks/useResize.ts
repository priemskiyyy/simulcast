import type { Accessor } from "solid-js";
import type { PanelPosition } from "src/types/PanelPosition";

const MIN_SIZE = 240;
const EDGE_MARGIN = 24;
const KEYBOARD_STEP = 24;

/** Pointer dragging and arrow-key handlers that resize a panel docked to one edge. */
export const useResize = ({
  position,
  size,
  onSizeChange,
}: {
  position: Accessor<PanelPosition>;
  size: Accessor<number>;
  onSizeChange: (size: number) => void;
}) => {
  const clamp = (value: number) => {
    const available =
      position() === "bottom" ? window.innerHeight : window.innerWidth;

    return Math.min(Math.max(value, MIN_SIZE), available - EDGE_MARGIN);
  };
  // Dragging the handle away from its edge grows the panel on either axis.
  const dragDistance = (start: PointerEvent, move: PointerEvent) =>
    position() === "bottom"
      ? start.clientY - move.clientY
      : start.clientX - move.clientX;

  const handlePointerDown = (
    event: PointerEvent & { currentTarget: HTMLElement },
  ) => {
    const handle = event.currentTarget;
    const startSize = size();
    const handlePointerMove = (move: PointerEvent) => {
      onSizeChange(clamp(startSize + dragDistance(event, move)));
    };
    const handlePointerUp = () => {
      handle.removeEventListener("pointermove", handlePointerMove);
      handle.removeEventListener("pointerup", handlePointerUp);
    };

    handle.setPointerCapture(event.pointerId);
    handle.addEventListener("pointermove", handlePointerMove);
    handle.addEventListener("pointerup", handlePointerUp);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const grow = position() === "bottom" ? "ArrowUp" : "ArrowLeft";
    const shrink = position() === "bottom" ? "ArrowDown" : "ArrowRight";

    if (event.key === grow) {
      event.preventDefault();
      onSizeChange(clamp(size() + KEYBOARD_STEP));
      return;
    }

    if (event.key === shrink) {
      event.preventDefault();
      onSizeChange(clamp(size() - KEYBOARD_STEP));
    }
  };

  return { handlePointerDown, handleKeyDown };
};
