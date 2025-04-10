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

// Helper to create default state
const createDefaultPresenceState = <
  P,
  K extends keyof P,
>(): PresenceResponseWithLoading<P, K> => ( {
  user: undefined,
  peers: {},
  isLoading: true,
  error: null,
} );

/**
 * Creates a reactive signal tracking peer presence data in a room...
 */
export function createPresence<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
  Keys extends keyof RoomSchema[ RoomType ][ "presence" ],
>(
  roomAccessor: Accessor<
    InstantSolidRoom<Schema, RoomSchema, RoomType> | undefined | null
  >,
  optsAccessor: Accessor<
    PresenceOpts<RoomSchema[ RoomType ][ "presence" ], Keys> | undefined
  > = () => ( {} )
): PresenceHandle<RoomSchema[ RoomType ][ "presence" ], Keys> {
  // Initial state setup
  const [ presenceState, setPresenceState ] = createSignal<
    PresenceResponseWithLoading<RoomSchema[ RoomType ][ "presence" ], Keys>
  >(
    createDefaultPresenceState<
      RoomSchema[ RoomType ][ "presence" ],
      Keys
    >()
  );

  // Effect for subscribing to presence updates.
  createEffect( () => {
    const room = roomAccessor();
    const opts = optsAccessor() ?? {};

    if ( !room ) {
      setPresenceState(
        createDefaultPresenceState<RoomSchema[ RoomType ][ "presence" ], Keys>()
      );
      return;
    }

    // Initialize with data from getPresence if available
    const initialState =
      room._core._reactor.getPresence( room.type, room.id, opts ) ??
      createDefaultPresenceState<RoomSchema[ RoomType ][ "presence" ], Keys>();

    setPresenceState( initialState );

    // Subscribe to presence updates
    const unsub = room._core._reactor.subscribePresence(
      room.type,
      room.id,
      opts,
      ( data: any ) => {
        setPresenceState( ( prev ) => ( {
          ...prev,
          ...data,
          isLoading: false
        } ) );
      }
    );

    onCleanup( () => {
      if ( typeof unsub === 'function' ) {
        unsub();
      }
    } );
  } );

  // Publish presence function
  const publishPresence = ( data: Partial<RoomSchema[ RoomType ][ "presence" ]> ) => {
    const room = roomAccessor();
    if ( !room ) {
      console.warn(
        "InstantDB: Cannot publish presence, room is not available yet."
      );
      return;
    }
    room._core._reactor.publishPresence( room.type, room.id, data );
  };

  // Return a stable reference
  return {
    get peers() { return presenceState().peers; },
    get user() { return presenceState().user; },
    get isLoading() { return presenceState().isLoading; },
    get error() { return presenceState().error; },
    publishPresence
  };
}
