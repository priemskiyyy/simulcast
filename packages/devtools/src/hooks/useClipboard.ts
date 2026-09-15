import { createSignal } from "solid-js";

const FEEDBACK_DURATION = 1_200;

/** Copies text and reports success briefly. Insecure origins have no clipboard, so copying does nothing there. */
export const useClipboard = () => {
  const [hasCopied, setHasCopied] = createSignal(false);

  const copy = (text: string) => {
    const { clipboard } = navigator;

    if (clipboard === undefined) {
      return;
    }

    clipboard.writeText(text).then(
      () => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), FEEDBACK_DURATION);
      },
      () => {},
    );
  };

  return { hasCopied, copy };
};
