// src/InstantSolidWebDatabase.ts
import type { InstantSchemaDef } from "@instantdb/core";
// Import the SolidJS version of the abstract base class
import InstantSolidAbstractDatabase from "./InstantSolidAbstractDatabase";

// Rename the class and extend the SolidJS base class
export default class InstantSolidWebDatabase<
  Schema extends InstantSchemaDef<any, any, any>,
> extends InstantSolidAbstractDatabase<Schema> {
  // Body remains empty, inheriting all methods from the Solid base class
}
