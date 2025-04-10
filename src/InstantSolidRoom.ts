// solidjs/src/InstantSolidRoom.ts
import {
  // types
  type PresenceOpts,
  type RoomSchemaShape,
  InstantCoreDatabase,
  InstantSchemaDef,
} from "@instantdb/core"; // Adjust path as needed

import type { Accessor } from "solid-js";

// Import the SolidJS hook functions
import { rooms } from "./rooms";

// Import SolidJS hook return types (adjust paths as needed)
import type {
  PresenceHandle,
  TypingIndicatorHandle,
  TypingIndicatorOpts,
} from "./hooks";

// ------------
// Class

export class InstantSolidRoom<
  Schema extends InstantSchemaDef<any, any, any>,
  RoomSchema extends RoomSchemaShape,
  RoomType extends keyof RoomSchema,
> {
  _core: InstantCoreDatabase<Schema>;
  type: RoomType;
  id: string;

  constructor(_core: InstantCoreDatabase<Schema>, type: RoomType, id: string) {
    this._core = _core;
    this.type = type;
    this.id = id;
  }

  // --- Deprecated Methods ---
  // These methods wrap the newer hook functions and should guide users
  // to use `db.rooms.create...` instead.
  // They might not behave reactively if called directly on the instance
  // without providing accessors, reinforcing their deprecated status.

  /**
   * @deprecated
   * `db.room(...).useTopicEffect` is deprecated. Use `db.rooms.createTopicEffect` with accessors instead.
   *
   * @example
   * // Before (React/Deprecated)
   * const room = db.room('chat', 'room-id');
   * room.useTopicEffect('emoji', (message, peer) => { });
   *
   * // After (SolidJS)
   * const room = () => db.room('chat', 'room-id');
   * db.rooms.createTopicEffect(room, () => 'emoji', (message, peer) => { });
   */
  useTopicEffect = <TopicType extends keyof RoomSchema[RoomType]["topics"]>(
    topic: TopicType,
    onEvent: (
      event: RoomSchema[RoomType]["topics"][TopicType],
      peer: RoomSchema[RoomType]["presence"]
    ) => any
  ): void => {
    console.warn(
      "Deprecated: Use db.rooms.createTopicEffect(roomAccessor, topicAccessor, onEvent) instead."
    );
    // Note: Calling this directly won't be reactive to room/topic changes.
    // Pass static values via accessors for the underlying hook.
    const roomAccessor = () => this;
    const topicAccessor = () => topic;
    rooms.createTopicEffect(roomAccessor, topicAccessor, onEvent);
  };

  /**
   * @deprecated
   * `db.room(...).usePublishTopic` is deprecated. Use `db.rooms.createPublishTopic` with accessors instead.
   *
   * @example
   * // Before (React/Deprecated)
   * const room = db.room('chat', 'room-id');
   * const publish = room.usePublishTopic('emoji');
   *
   * // After (SolidJS)
   * const room = () => db.room('chat', 'room-id');
   * const publish = db.rooms.createPublishTopic(room, () => 'emoji');
   */
  usePublishTopic = <Topic extends keyof RoomSchema[RoomType]["topics"]>(
    topic: Topic
  ): ((data: RoomSchema[RoomType]["topics"][Topic]) => void) => {
    console.warn(
      "Deprecated: Use db.rooms.createPublishTopic(roomAccessor, topicAccessor) instead."
    );
    // Note: Calling this directly won't be reactive to room/topic changes.
    const roomAccessor = () => this;
    const topicAccessor = () => topic;
    return rooms.createPublishTopic(roomAccessor, topicAccessor);
  };

  /**
   * @deprecated
   * `db.room(...).usePresence` is deprecated. Use `db.rooms.createPresence` with accessors instead.
   *
   * @example
   * // Before (React/Deprecated)
   * const room = db.room('chat', 'room-id');
   * const { peers } = room.usePresence({ keys: ["name", "avatar"] });
   *
   * // After (SolidJS)
   * const room = () => db.room('chat', 'room-id');
   * const presence = db.rooms.createPresence(room, () => ({ keys: ["name", "avatar"] }));
   * // Access reactive state: presence.peers, presence.isLoading
   */
  usePresence = <Keys extends keyof RoomSchema[RoomType]["presence"]>(
    opts: PresenceOpts<RoomSchema[RoomType]["presence"], Keys> = {}
  ): PresenceHandle<RoomSchema[RoomType]["presence"], Keys> => {
    console.warn(
      "Deprecated: Use db.rooms.createPresence(roomAccessor, optsAccessor) instead."
    );
    // Note: Calling this directly won't be reactive to room/opts changes.
    const roomAccessor = () => this;
    const optsAccessor = () => opts;
    // The return value from createPresence is already unwrapped, suitable for direct use,
    // but its properties won't update reactively if the initial opts/room change.
    return rooms.createPresence(roomAccessor, optsAccessor);
  };

  /**
   * @deprecated
   * `db.room(...).useSyncPresence` is deprecated. Use `db.rooms.createSyncPresence` with accessors instead.
   *
   * @example
   * // Before (React/Deprecated)
   * const room = db.room('chat', 'room-id');
   * room.useSyncPresence({ nickname }); // 'deps' argument not used in Solid version
   *
   * // After (SolidJS)
   * const room = () => db.room('chat', 'room-id');
   * const data = () => ({ nickname: props.nickname }); // Reactive data accessor
   * db.rooms.createSyncPresence(room, data);
   */
  useSyncPresence = (
    data: Partial<RoomSchema[RoomType]["presence"]>,
    _deps?: any[] // Indicate deps are unused
  ): void => {
    console.warn(
      "Deprecated: Use db.rooms.createSyncPresence(roomAccessor, dataAccessor) instead."
    );
    // Note: Calling this directly won't be reactive to room/data changes.
    const roomAccessor = () => this;
    const dataAccessor = () => data;
    return rooms.createSyncPresence(roomAccessor, dataAccessor);
  };

  /**
   * @deprecated
   * `db.room(...).useTypingIndicator` is deprecated. Use `db.rooms.createTypingIndicator` with accessors instead.
   *
   * @example
   * // Before (React/Deprecated)
   * const room = db.room('chat', 'room-id');
   * const typing = room.useTypingIndicator('chat-input');
   *
   * // After (SolidJS)
   * const room = () => db.room('chat', 'room-id');
   * const typing = db.rooms.createTypingIndicator(room, () => 'chat-input');
   * // Use accessors: <input {...typing.inputProps()} /> Active: {typing.active()}
   */
  useTypingIndicator = (
    inputName: string,
    opts: TypingIndicatorOpts = {}
  ): TypingIndicatorHandle<RoomSchema[RoomType]["presence"]> => {
    console.warn(
      "Deprecated: Use db.rooms.createTypingIndicator(roomAccessor, inputNameAccessor, optsAccessor) instead."
    );
    // Note: Calling this directly won't be reactive to changes.
    const roomAccessor = () => this;
    const inputNameAccessor = () => inputName;
    const optsAccessor = () => opts;
    // Return value contains accessors for reactive parts (active, inputProps)
    return rooms.createTypingIndicator(
      roomAccessor,
      inputNameAccessor,
      optsAccessor
    );
  };
}
