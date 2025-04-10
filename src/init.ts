import type {
  InstantConfig,
  InstantSchemaDef,
  InstantUnknownSchema,
} from '@instantdb/core';

import InstantSolidWebDatabase from './InstantSolidWebDatabase';
import version from './version';

/**
 *
 * The first step: init your application!
 *
 * Visit https://instantdb.com/dash to get your `appId` :)
 *
 * @example
 *  import { init } from "@instantdb/solid"
 *
 *  const db = init({ appId: "my-app-id" })
 *
 *  // You can also provide a schema for type safety and editor autocomplete!
 *
 *  import { init } from "@instantdb/solid"
 *  import schema from "../instant.schema.ts";
 *
 *  const db = init({ appId: "my-app-id", schema })
 *
 *  // To learn more: https://instantdb.com/docs/modeling-data
 */
export function init<
  Schema extends InstantSchemaDef<any, any, any> = InstantUnknownSchema,
>( config: InstantConfig<Schema> ) {
  return new InstantSolidWebDatabase<Schema>( config, {
    '@jeetkhinde/instantdb-solid': version,
  } );
}
