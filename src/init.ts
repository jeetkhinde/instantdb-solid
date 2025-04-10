// solid/src/init.ts

import type {
  InstantConfig,
  InstantSchemaDef,
  InstantUnknownSchema,
} from "@instantdb/core";


import InstantSolidWebDatabase from "./InstantSolidWebDatabase";

export function init<
  Schema extends InstantSchemaDef<any, any, any> = InstantUnknownSchema,
>( config: InstantConfig<Schema> ) {
  return new InstantSolidWebDatabase<Schema>( config );
}
