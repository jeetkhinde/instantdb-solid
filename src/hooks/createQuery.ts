// src/createQuery.ts
import {
  createSignal,
  createEffect,
  onCleanup,
  Accessor,
} from "solid-js";
import { createStore } from "solid-js/store";

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

// --- Helper functions ---
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
  // Handle reactive and non-reactive query definitions
  const getQuery = () => {
    const queryInput = typeof _query === "function" ? _query() : _query;
    const opts = typeof _opts === "function" ? _opts() : _opts;

    if ( !queryInput ) return null;

    // Process the query with rule params if provided
    let processedQuery = { ...queryInput };
    if ( opts && "ruleParams" in opts ) {
      processedQuery = { $$ruleParams: opts.ruleParams, ...processedQuery };
    }

    return coerceQuery( processedQuery );
  };

  // Initial query and state setup
  const initialQuery = getQuery();
  const initialResult = _core?._reactor?.getPreviousResult( initialQuery );
  const initialState = stateForResult<Schema, Q>( initialResult );

  // Create state store
  const [ state, setState ] = createStore<InstaQLLifecycleState<Schema, Q>>( initialState );

  // Create a signal to track current query
  const [ query, setQuery ] = createSignal<Query | null>( initialQuery );

  // Effect to handle query subscriptions
  createEffect( () => {
    const currentDb = _core;
    const currentQuery = getQuery();

    // Update query signal when the query changes
    setQuery( currentQuery );

    if ( !currentDb || !currentQuery ) {
      const resetState = defaultState as unknown as InstaQLLifecycleState<Schema, Q>;
      setState( resetState );
      return;
    }

    // Check for cached results
    const cachedResult = currentDb._reactor.getPreviousResult( currentQuery );
    if ( cachedResult ) {
      setState( stateForResult( cachedResult ) );
    } else if ( !state.isLoading ) {
      setState( { ...state, isLoading: true } );
    }

    // Subscribe to query updates
    const unsubscribe = currentDb.subscribeQuery<Q>( currentQuery, ( result ) => {
      setState( stateForResult( result ) );
    } );

    // Cleanup subscription when dependencies change or component unmounts
    onCleanup( () => {
      if ( typeof unsubscribe === 'function' ) {
        unsubscribe();
      }
    } );
  } );

  return {
    state: () => state,
    query: () => query()
  };
}
