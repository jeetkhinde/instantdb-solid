// solidjs/src/hooks/index.ts

// Export the hook functions
export { createTimeout } from "./createTimeout";
export { createTopicEffect } from "./createTopicEffect";
export { createPublishTopic } from "./createPublishTopic";
export { createPresence } from "./createPresence";
export { createSyncPresence } from "./createSyncPresence";
export { createTypingIndicator } from "./createTypingIndicator";
export { createQuery } from "./createQuery";

// --- Export types from the central types file ---
export type {
  PresenceOpts,
  PresenceResponseWithLoading,
  PresenceHandle,
  TypingIndicatorOpts,
  TypingIndicatorHandle,
} from "../types";

export type { PresenceResponse } from "@instantdb/core";
