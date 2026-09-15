import { Show, createSignal } from "solid-js";
import {
  useChannelStatus,
  useConnectionState,
} from "@priemskiyyy/simulcast-solid";
import { Consumer } from "./Consumer";

export const Session = (props: { user: string }) => {
  const channel = () => `private:${props.user}`;
  const [first, setFirst] = createSignal(true);
  const [second, setSecond] = createSignal(true);
  const connection = useConnectionState();
  const status = useChannelStatus(channel);

  return (
    <section>
      <output data-testid="connection">{connection()}</output>
      <output data-testid="channel">{status().state}</output>
      <label>
        <input
          type="checkbox"
          checked={first()}
          onChange={(event) => setFirst(event.currentTarget.checked)}
        />
        First consumer
      </label>
      <label>
        <input
          type="checkbox"
          checked={second()}
          onChange={(event) => setSecond(event.currentTarget.checked)}
        />
        Second consumer
      </label>
      <Show when={first()}>
        <Consumer channel={channel()} name="first" />
      </Show>
      <Show when={second()}>
        <Consumer channel={channel()} name="second" />
      </Show>
    </section>
  );
};
