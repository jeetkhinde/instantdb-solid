// solid/src/hooks/createTopicEffect.ts

import { type RoomSchemaShape, InstantSchemaDef } from "@instantdb/core";

import { createEffect, onCleanup } from "solid-js";

import type { InstantSolidRoom } from "../InstantSolidRoom";

// ------
// Topics

/**
 * Creates a reactive effect that listens for topic events in an InstantDB room.
 * Automatically handles subscription cleanup when dependencies change or component unmounts.
 *
 * @param roomAccessor - Function that returns the room instance to subscribe to
 * @param topicAccessor - Function that returns the topic name to subscribe to
 * @param onEvent - Callback that runs when a topic event is received
 * 
 * @see https://instantdb.com/docs/presence-and-topics
 * @example
 * ```tsx
 * function ChatRoom(props) {
 *   const db = useInstant();
 *   // Create a reactive accessor for the room
 *   const room = () => db.room('chats', props.roomId);
 *   
 *   // Subscribe to emoji reactions
 *   createTopicEffect(
 *     room,
 *     () => 'emoji',
 *     (emoji, peer) => {
 *       console.log(`${peer.name} sent emoji: ${emoji}`);
 *       // Update UI or state based on the received event
 *     }
 *   );
 *   
 *   return <div>Chat Room</div>;
 * }
 * ```
 */
export function createTopicEffect<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  TopicType extends keyof RoomSchema[ RoomType ][ "topics" ],
>(
  // Use Accessor functions for reactive props
  roomAccessor: () =>
    | InstantSolidRoom<Schema, RoomSchema, RoomType>
    | undefined
    | null,
  topicAccessor: () => TopicType,
  onEvent: (
    event: RoomSchema[ RoomType ][ "topics" ][ TopicType ],
    peer: RoomSchema[ RoomType ][ "presence" ]
  ) => any
): void {
  // SolidJS automatically tracks dependencies: roomAccessor(), topicAccessor()
  createEffect( () => {
    const room = roomAccessor();
    const topic = topicAccessor();

    // Only run the effect if room and topic are valid
    if ( !room || !topic ) {
      return; // Skip effect run if dependencies aren't ready
    }

    // Subscribe to the topic
    const unsub = room._core._reactor.subscribeTopic(
      room.id,
      topic as string,
      ( event: any, peer: any ) => {
        // Call onEvent with the received data
        if ( typeof onEvent === 'function' ) {
          onEvent( event, peer );
        }
      }
    );

    // Cleanup function to unsubscribe when effect re-runs or component unmounts
    onCleanup( () => {
      if ( typeof unsub === 'function' ) {
        unsub();
      }
    } );
  } );
}
