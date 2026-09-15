/** Phoenix delivers an event name, its payload, and the message ref; this is what `publication.native` holds. */
export type PhoenixPublication = {
  event: string;
  payload: unknown;
  ref: unknown;
};
