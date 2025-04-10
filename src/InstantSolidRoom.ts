// solidjs/src/InstantSolidRoom.ts
import {
  type RoomSchemaShape,
  InstantCoreDatabase,
  InstantSchemaDef,
} from "@instantdb/core"; // Adjust path as needed



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

  constructor ( _core: InstantCoreDatabase<Schema>, type: RoomType, id: string ) {
    this._core = _core;
    this.type = type;
    this.id = id;
  }

}

// methods using guide
// db.rooms.createTopicEffect to create a topic effect
// db.rooms.createPublishTopic to create a publish topic
// db.rooms.createPresence to create a presence
// db.rooms.createSyncPresence to create a sync presence
// db.rooms.createTypingIndicator to create a typing indicator
