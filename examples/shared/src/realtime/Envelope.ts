import type { EventName, Events } from "./Events";

/** The wire shape every publication carries: the event name and its body. */
export type Envelope<TName extends EventName = EventName> = {
  name: TName;
  body: Events[TName]["payload"];
};

/** An envelope together with the channel it is published on. */
export type Publication<TName extends EventName = EventName> = {
  channel: Events[TName]["channel"];
  envelope: Envelope<TName>;
};
