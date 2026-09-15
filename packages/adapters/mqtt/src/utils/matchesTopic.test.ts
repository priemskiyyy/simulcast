import { expect, test } from "vitest";
import { matchesTopic } from "src/utils/matchesTopic";

test.each([
  ["rooms/one", "rooms/one", true],
  ["rooms/one", "rooms/two", false],
  ["rooms/+", "rooms/two", true],
  ["rooms/+", "rooms/two/messages", false],
  ["rooms/+/messages", "rooms/two/messages", true],
  ["rooms/#", "rooms", true],
  ["rooms/#", "rooms/two/messages", true],
  ["#", "anything/at/all", true],
  ["rooms/+", "rooms", false],
  ["#", "$SYS/broker/uptime", false],
  ["+/broker/uptime", "$SYS/broker/uptime", false],
  ["$SYS/#", "$SYS/broker/uptime", true],
  ["$SYS/+/uptime", "$SYS/broker/uptime", true],
  ["rooms/+", "rooms/$system", true],
])("%s matches %s: %s", (filter, topic, expected) => {
  expect(matchesTopic(filter, topic)).toBe(expected);
});
