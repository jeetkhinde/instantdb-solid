// solid/src/hooks/createTopicEffect.ts

import { type RoomSchemaShape, InstantSchemaDef } from "@instantdb/core";

import { createEffect, onCleanup } from "solid-js";

import type { InstantSolidRoom } from "../InstantSolidRoom";

// ------
// Topics

/**
 * Creates an effect to listen for broadcasted events given a room and topic.
 *
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 * function App(props) {
 * const room = () => db.room('chats', props.roomId); // Assuming db instance is available
 * db.rooms.createTopicEffect(room, 'emoji', (message, peer) => {
 * console.log(peer.name, 'sent', message);
 * });
 * // ...
 * }
 */
export function createTopicEffect<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  TopicType extends keyof RoomSchema[RoomType]["topics"],
>(
  // Use Accessor functions for reactive props
  roomAccessor: () =>
    | InstantSolidRoom<Schema, RoomSchema, RoomType>
    | undefined
    | null,
  topicAccessor: () => TopicType,
  onEvent: (
    event: RoomSchema[RoomType]["topics"][TopicType],
    peer: RoomSchema[RoomType]["presence"]
  ) => any
): void {
  // SolidJS automatically tracks dependencies: roomAccessor(), topicAccessor()
  createEffect(() => {
    const room = roomAccessor();
    const topic = topicAccessor();

    // Only run the effect if room and topic are valid
    if (!room || !topic) {
      return; // Skip effect run if dependencies aren't ready
    }

    const unsub = room._core._reactor.subscribeTopic(
      room.id,
      topic,
      (event, peer) => {
        onEvent(event, peer);
      }
    );

    // Cleanup function to unsubscribe when effect re-runs or component unmounts
    onCleanup(() => {
      unsub();
    });
  });
}
