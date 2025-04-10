// src/createQuery.ts
import {
  createSignal,
  createEffect,
  onCleanup,
  Accessor,
  createMemo,
} from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";

import {
  weakHash,
  coerceQuery,
  InstantCoreDatabase,
  InstaQLLifecycleState,
} from "@instantdb/core";

import type {
  InstantSchemaDef,
  InstaQLParams,
  Query,
  InstaQLOptions,
} from "@instantdb/core";

// --- Helper functions (similar to React version) ---
const defaultState = {
  isLoading: true,
  data: undefined,
  pageInfo: undefined,
  error: undefined,
};

function stateForResult<
  Schema extends InstantSchemaDef<any, any, any>,
  Q extends InstaQLParams<Schema>,
>(
  result: Partial<InstaQLLifecycleState<Schema, Q>> | null | undefined
): InstaQLLifecycleState<Schema, Q> {
  return {
    isLoading: !Boolean( result ),
    data: undefined,
    pageInfo: undefined,
    error: undefined,
    ...( result || {} ),
  } as InstaQLLifecycleState<Schema, Q>;
}

// --- SolidJS Primitive ---

export function createQuery<
  Schema extends InstantSchemaDef<any, any, any>,
  Q extends InstaQLParams<Schema>,
>(
  _core: InstantCoreDatabase<Schema>,
  _query: Q | null | Accessor<Q | null>,
  _opts?: InstaQLOptions | Accessor<InstaQLOptions | undefined>
): {
  state: Accessor<InstaQLLifecycleState<Schema, Q>>;
  query: Accessor<Query | null>;
} {
  const queryMemo = createMemo( () => {
    const queryInput = typeof _query === "function" ? _query() : _query;
    const opts = typeof _opts === "function" ? _opts() : _opts;

    if ( !queryInput ) return null;

    let processedQuery = { ...queryInput };
    if ( opts && "ruleParams" in opts ) {
      processedQuery = { $$ruleParams: opts.ruleParams, ...processedQuery };
    }

    return coerceQuery( processedQuery );
  } );
  const queryHashMemo = createMemo( () => weakHash( queryMemo() ) );
  const initialQuery = queryMemo();
  const initialResult = _core?._reactor?.getPreviousResult( initialQuery );
  const initialState = stateForResult<Schema, Q>( initialResult );

  const [ state, setState ] =
    createStore<InstaQLLifecycleState<Schema, Q>>( initialState );

  createEffect( () => {
    const currentDb = _core;
    const currentQuery = queryMemo();
    if ( !currentDb || !currentQuery ) {
      const resetState = defaultState as unknown as InstaQLLifecycleState<
        Schema,
        Q
      >;

      if (
        state.data !== resetState.data ||
        state.error !== resetState.error ||
        state.isLoading !== resetState.isLoading
      ) {
        setState( resetState );
      }
      return;
    }
    const cachedResult = currentDb._reactor.getPreviousResult( currentQuery );
    if ( cachedResult ) {
      setState( stateForResult( cachedResult ) );
    } else if ( !state.isLoading ) {
      setState( ( s: InstaQLLifecycleState<Schema, Q> ) => ( {
        ...s,
        isLoading: true,
      } ) );
    }
    const unsubscribe = currentDb.subscribeQuery<Q>( currentQuery, ( result ) => {
      setState( stateForResult( result ) );
    } );

    onCleanup( () => {
      unsubscribe();
    } );
  } );
  return { state: () => state, query: queryMemo };
}
