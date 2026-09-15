import { useClipboard } from "src/hooks/useClipboard";

type CopyButtonProps = {
  text: string;
};

export const CopyButton = (props: CopyButtonProps) => {
  const { hasCopied, copy } = useClipboard();

  return (
    <button type="button" class="copy" onClick={() => copy(props.text)}>
      {hasCopied() ? "Copied" : "Copy"}
    </button>
  );
};
