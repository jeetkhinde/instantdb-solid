// solidjs/src/rooms.ts

// Import the hook functions from the central export point in the hooks directory
import {
  createTopicEffect,
  createPublishTopic,
  createPresence,
  createSyncPresence,
  createTypingIndicator,
} from "./hooks/index"; // Changed import source

// Export the bundled object for use like `db.rooms.create...`
export const rooms = {
  createTopicEffect,
  createPublishTopic,
  createPresence,
  createSyncPresence,
  createTypingIndicator,
};
