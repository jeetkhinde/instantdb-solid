// solidjs/src/hooks/createSyncPresence.ts
import { type RoomSchemaShape, type InstantSchemaDef } from "@instantdb/core";

import { createEffect, Accessor, untrack } from "solid-js";
import { InstantSolidRoom } from "../InstantSolidRoom";

export function createSyncPresence<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
>(
  roomAccessor: Accessor<
    InstantSolidRoom<Schema, RoomSchema, RoomType> | undefined | null
  >,
  dataAccessor: Accessor<Partial<RoomSchema[RoomType]["presence"]>>
  // Note: Solid's createEffect automatically tracks dependencies in dataAccessor.
  // Explicit deps array like React is usually not needed unless fine-tuning with untrack/on.
): void {
  // Effect to join the room
  createEffect(() => {
    const room = roomAccessor();
    if (room) {
      room._core._reactor.joinRoom(room.id);
    }
    // No cleanup needed for joinRoom itself
  }); // Tracks roomAccessor

  // Effect to publish presence data when it changes
  createEffect(() => {
    const room = roomAccessor();
    const data = dataAccessor(); // This tracks dependencies within the data object/accessor
    if (room && data) {
      // Use untrack for room details inside the data-driven effect
      // if we only want this effect to re-run when `data` changes, not when `room` changes.
      // However, if `room` changes, we likely *do* want to republish to the new room,
      // so automatic tracking is probably correct here.
      const currentRoom = untrack(roomAccessor); // Optional: use latest room data without re-triggering from room change itself
      if (currentRoom) {
        currentRoom._core._reactor.publishPresence(
          currentRoom.type,
          currentRoom.id,
          data
        );
      }
    }
    // publishPresence returns an unsubscribe function, could be used for cleanup if needed,
    // but typically presence is meant to be active while the effect runs.
    // Let's assume core handles overwriting/updating presence correctly.
  }); // Tracks roomAccessor and dataAccessor
}
