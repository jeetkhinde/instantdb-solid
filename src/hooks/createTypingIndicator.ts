// solidjs/src/hooks/createTypingIndicator.ts
import { type RoomSchemaShape, type InstantSchemaDef } from "@instantdb/core";

import { createMemo, Accessor, onCleanup } from "solid-js";

import { createTimeout, createPresence } from "./index";

import type { TypingIndicatorOpts, TypingIndicatorHandle } from "../types";
import type { InstantSolidRoom } from "../InstantSolidRoom";

export const defaultActivityStopTimeout = 1_000;

export function createTypingIndicator<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
>(
  roomAccessor: Accessor<
    InstantSolidRoom<Schema, RoomSchema, RoomType> | undefined | null
  >,
  inputNameAccessor: Accessor<string>,
  optsAccessor: Accessor<TypingIndicatorOpts | undefined> = () => ({})
): TypingIndicatorHandle<RoomSchema[RoomType]["presence"]> {
  const timeout = createTimeout();

  // Use the Solid createPresence hook, passing the input name as a key
  const presenceOpts = createMemo(() => ({
    keys: [inputNameAccessor()] as (keyof RoomSchema[RoomType]["presence"])[],
  }));
  const observedPresence = createPresence(roomAccessor, presenceOpts);

  // Memoize the calculation of active peers.
  // Dependencies: roomAccessor, inputNameAccessor, optsAccessor, potentially observedPresence if used.
  const active = createMemo(() => {
    const room = roomAccessor();
    const opts = optsAccessor() ?? {};
    const inputName = inputNameAccessor();

    if (opts.writeOnly || !room) {
      return [];
    }

    // Get the latest presence snapshot directly from core for filtering
    // Note: observedPresence signal could also be used, but might be slightly delayed
    // compared to the raw snapshot needed here. Let's use the direct snapshot.
    const presenceSnapshot = room._core._reactor.getPresence(
      room.type,
      room.id
    );
    if (!presenceSnapshot || !presenceSnapshot.peers) {
      return [];
    }

    return Object.values(presenceSnapshot.peers).filter(
      (p) => p[inputName] === true
    );
  });

  // Function to set the user's typing state
  const setActive = (isActive: boolean) => {
    const room = roomAccessor();
    const inputName = inputNameAccessor();
    const opts = optsAccessor() ?? {};

    if (!room || !inputName) return;

    // Publish the presence update
    room._core._reactor.publishPresence(room.type, room.id, {
      [inputName]: isActive ? true : null, // Use null to clear, true to set
    } as unknown as Partial<RoomSchema[RoomType]["presence"]>);

    // Clear any existing timeout
    timeout.clear();

    // Set a new timeout if user is active and timeout is enabled
    if (isActive && opts.timeout !== null && opts.timeout !== 0) {
      timeout.set(opts.timeout ?? defaultActivityStopTimeout, () => {
        // Ensure room still exists when timeout fires
        const currentRoom = roomAccessor();
        if (currentRoom) {
          currentRoom._core._reactor.publishPresence(
            currentRoom.type,
            currentRoom.id,
            {
              [inputName]: null, // Set to null when timeout expires
            } as Partial<RoomSchema[RoomType]["presence"]>
          );
        }
      });
    }
  };

  // Event handlers
  // Use KeyboardEvent type from DOM. Types are defined in types.ts file
  const onKeyDown = (e: KeyboardEvent) => {
    const opts = optsAccessor() ?? {};
    const isEnter = opts.stopOnEnter && e.key === "Enter";
    setActive(!isEnter);
  };

  // Use FocusEvent type from DOM. Types are defined in types.ts file
  const onBlur = (e: FocusEvent) => {
    setActive(false);
  };

  // Memoize input props object - needs to be an accessor itself
  const inputProps = createMemo(() => ({ onKeyDown, onBlur }));

  // Cleanup timeout when the owner scope is disposed
  onCleanup(() => {
    timeout.clear();
    // Also explicitly set inactive on cleanup? Maybe not necessary if component unmounts.
    // setActive(false); // Consider if this is desired behavior
  });

  return {
    active, // Return the memoized accessor
    setActive,
    inputProps, // Return the memoized accessor
  };
}
