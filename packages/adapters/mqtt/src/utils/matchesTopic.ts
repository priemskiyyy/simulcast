/** MQTT topic-filter matching: `+` matches one level, `#` matches the rest including the parent. */
export const matchesTopic = (filter: string, topic: string) => {
  // MQTT reserves root-level $ topics for explicitly matching filters.
  if (topic.startsWith("$") && !filter.startsWith("$")) {
    return false;
  }

  const filterLevels = filter.split("/");
  const topicLevels = topic.split("/");

  for (const [index, level] of filterLevels.entries()) {
    if (level === "#") {
      return topicLevels.length >= index;
    }

    if (level === "+") {
      if (topicLevels.length <= index) {
        return false;
      }

      continue;
    }

    if (level !== topicLevels[index]) {
      return false;
    }
  }

  return filterLevels.length === topicLevels.length;
};
