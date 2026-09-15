import { createSignal } from "solid-js";
import { useChannel } from "@priemskiyyy/simulcast-solid";

export const Consumer = (props: { channel: string; name: string }) => {
  const [messages, setMessages] = createSignal<string[]>([]);

  useChannel<{ text: string }>(
    () => props.channel,
    (message) => {
      setMessages((previous) => [...previous, message.text]);
    },
  );

  return <output data-testid={props.name}>{JSON.stringify(messages())}</output>;
};
