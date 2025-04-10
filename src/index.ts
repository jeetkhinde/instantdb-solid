import {
  id,
  tx,
  lookup,
  i,

  // types
  type QueryResponse,
  type InstantQuery,
  type InstantQueryResult,
  type InstantSchema,
  type InstantObject,
  type InstantEntity,
  type InstantSchemaDatabase,
  type IInstantDatabase,
  type User,
  type AuthState,
  type Query,
  type Config,
  type InstaQLParams,
  type ConnectionStatus,

  // schema types
  type AttrsDefs,
  type CardinalityKind,
  type DataAttrDef,
  type EntitiesDef,
  type EntitiesWithLinks,
  type EntityDef,
  type InstantGraph,
  type LinkAttrDef,
  type LinkDef,
  type LinksDef,
  type ResolveAttrs,
  type ValueTypes,
  type InstaQLEntity,
  type InstaQLFields,
  type InstaQLResult,
  type InstantUnknownSchema,
  type InstantSchemaDef,
  type BackwardsCompatibleSchema,
  type InstantRules,
  type UpdateParams,
  type LinkParams,
  type ExchangeCodeForTokenParams,
  type SendMagicCodeParams,
  type SendMagicCodeResponse,
  type SignInWithIdTokenParams,
  type VerifyMagicCodeParams,
  type VerifyResponse,

  // storage types
  type FileOpts,
  type UploadFileResponse,
  type DeleteFileResponse,
} from '@instantdb/core';

import InstantSolidAbstractDatabase from './InstantSolidAbstractDatabase';
import InstantSolidWebDatabase from './InstantSolidWebDatabase';
import {init} from './init';
import {Cursors} from './Cursors';

export {
  id,
  tx,
  lookup,
  init,
  InstantSolidWebDatabase,
  Cursors,
  i,

  // internal
  InstantSolidAbstractDatabase,

  // types
  type Config,
  type Query,
  type QueryResponse,
  type InstantObject,
  type User,
  type AuthState,
  type ConnectionStatus,
  type InstantQuery,
  type InstantQueryResult,
  type InstantSchema,
  type InstantEntity,
  type InstantSchemaDatabase,
  type IInstantDatabase,
  type InstaQLParams,
  type InstaQLFields,

  // schema types
  type AttrsDefs,
  type CardinalityKind,
  type DataAttrDef,
  type EntitiesDef,
  type EntitiesWithLinks,
  type EntityDef,
  type InstantGraph,
  type LinkAttrDef,
  type LinkDef,
  type LinksDef,
  type ResolveAttrs,
  type ValueTypes,
  type InstaQLEntity,
  type InstaQLResult,
  type InstantUnknownSchema,
  type InstantSchemaDef,
  type BackwardsCompatibleSchema,
  type InstantRules,
  type UpdateParams,
  type LinkParams,
  type ExchangeCodeForTokenParams,
  type SendMagicCodeParams,
  type SendMagicCodeResponse,
  type SignInWithIdTokenParams,
  type VerifyMagicCodeParams,
  type VerifyResponse,

  // storage types
  type FileOpts,
  type UploadFileResponse,
  type DeleteFileResponse,
};
