// solidjs/src/hooks/createPresence.ts
import {
  type PresenceOpts as CorePresenceOpts,
  type PresenceResponse,
  type RoomSchemaShape,
  type InstantSchemaDef,
} from "@instantdb/core";

import {
  createSignal,
  createEffect,
  onCleanup,
  Accessor,
  createMemo,
} from "solid-js";
import type { InstantSolidRoom } from "../InstantSolidRoom";

import type {
  PresenceHandle,
  PresenceResponseWithLoading,
  PresenceOpts,
} from "./index";

// Helper to create default state (can remain local or moved to types.ts if reused)
const createDefaultPresenceState = <
  P,
  K extends keyof P,
>(): PresenceResponseWithLoading<P, K> => ({
  user: undefined,
  peers: {},
  isLoading: true,
  error: null, // Ensure error is explicitly included to match the expected type
});

/**
 * Creates a reactive signal tracking peer presence data in a room...
 */
export function createPresence<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  Keys extends keyof RoomSchema[RoomType]["presence"],
>(
  roomAccessor: Accessor<
    InstantSolidRoom<Schema, RoomSchema, RoomType> | undefined | null
  >,
  optsAccessor: Accessor<
    PresenceOpts<RoomSchema[RoomType]["presence"], Keys> | undefined
  > = () => ({})
  // Return type uses the imported PresenceHandle
): PresenceHandle<RoomSchema[RoomType]["presence"], Keys> {
  // Initial state setup
  const getInitialState = () => {
    const room = roomAccessor();
    const opts = optsAccessor() ?? {};
    if (!room)
      return createDefaultPresenceState<
        RoomSchema[RoomType]["presence"],
        Keys
      >();
    // Use getPresence for initial non-reactive value if available
    return (
      room._core._reactor.getPresence(room.type, room.id, opts) ??
      createDefaultPresenceState()
    );
  };

  const [presenceState, setPresenceState] = createSignal<
    PresenceResponseWithLoading<RoomSchema[RoomType]["presence"], Keys>
  >(
    getInitialState() as PresenceResponseWithLoading<
      RoomSchema[RoomType]["presence"],
      Keys
    >
  );

  // Effect for subscribing to presence updates.
  // Dependencies: roomAccessor(), optsAccessor() -> Solid tracks these automatically
  createEffect(() => {
    const room = roomAccessor();
    const opts = optsAccessor() ?? {}; // Use default empty object if optsAccessor returns undefined
    if (!room) {
      // If the room becomes null/undefined, reset state to loading
      setPresenceState(
        createDefaultPresenceState<RoomSchema[RoomType]["presence"], Keys>()
      );
      return; // Skip subscription if no room
    }

    // Ensure the state reflects the potentially new initial data for the current room/opts
    // This handles cases where the roomAccessor/optsAccessor changes
    const initialState =
      room._core._reactor.getPresence(room.type, room.id, opts) ??
      createDefaultPresenceState<RoomSchema[RoomType]["presence"], Keys>();
    setPresenceState(initialState);

    const unsub = room._core._reactor.subscribePresence(
      room.type,
      room.id,
      opts,
      (data: any) => {
        // data already includes isLoading: false from core potentially
        setPresenceState((prev) => ({ ...prev, ...data, isLoading: false }));
      }
    );

    onCleanup(() => {
      unsub();
    });
  });

  // Publish presence function
  const publishPresence = (data: Partial<RoomSchema[RoomType]["presence"]>) => {
    const room = roomAccessor();
    if (!room) {
      console.warn(
        "InstantDB: Cannot publish presence, room is not available yet."
      );
      return;
    }
    room._core._reactor.publishPresence(room.type, room.id, data);
  };

  // Combine state and actions into the handle
  const handle = createMemo(() => ({
    ...presenceState(),
    publishPresence,
  }));
  return handle();
}
