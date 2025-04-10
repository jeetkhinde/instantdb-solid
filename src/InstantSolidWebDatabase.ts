
import type {InstantSchemaDef} from "@instantdb/core";
import InstantSolidAbstractDatabase from "./old/InstantSolidAbstractDatabase";

export default class InstantSolidWebDatabase<
  Schema extends InstantSchemaDef<any, any, any>,
> extends InstantSolidAbstractDatabase<Schema> {}
