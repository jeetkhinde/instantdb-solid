// solidjs/src/hooks/createPublishTopic.ts
import { type RoomSchemaShape, type InstantSchemaDef } from "@instantdb/core";

import { createEffect, Accessor } from "solid-js";
import type { InstantSolidRoom } from "../InstantSolidRoom";

export function createPublishTopic<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  TopicType extends keyof RoomSchema[RoomType]["topics"],
>(
  roomAccessor: Accessor<
    InstantSolidRoom<Schema, RoomSchema, RoomType> | undefined | null
  >,
  topicAccessor: Accessor<TopicType>
): (data: RoomSchema[RoomType]["topics"][TopicType]) => void {
  // Effect to join the room when the room ID changes
  createEffect(() => {
    const room = roomAccessor();
    if (room) {
      // Attempt to join the room. The reactor likely handles duplicate joins.
      // No cleanup needed here as leaving rooms is usually handled differently (e.g., closing connection)
      room._core._reactor.joinRoom(room.id);
    }
  });

  // The publish function itself doesn't need to be memoized like in React's useCallback
  const publishTopic = (
    data: RoomSchema[RoomType]["topics"][TopicType]
  ): void => {
    const room = roomAccessor();
    const topic = topicAccessor();
    if (!room || !topic) {
      console.warn(
        "InstantDB: Cannot publish topic, room or topic is not available yet."
      );
      return;
    }
    room._core._reactor.publishTopic({
      roomType: room.type,
      roomId: room.id,
      topic: topic,
      data,
    });
  };

  return publishTopic;
}
