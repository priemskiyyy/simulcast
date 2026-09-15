import type { PartySocketOptions } from "partysocket";

/** PartySocket options without `room`; each channel becomes a room. */
export type PartykitAdapterOptions = Omit<PartySocketOptions, "room">;
