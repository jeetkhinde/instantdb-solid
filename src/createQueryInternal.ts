import {createSignal, createEffect, onCleanup} from 'solid-js';
import {
  weakHash,
  coerceQuery,
  type Query,
  type Exactly,
  type LifecycleSubscriptionState,
  type InstaQLParams,
  type InstaQLOptions,
  type InstantGraph,
  InstantCoreDatabase,
  InstaQLLifecycleState,
  InstantSchemaDef,
} from '@instantdb/core';

const defaultState = {
  isLoading: true,
  data: undefined,
  pageInfo: undefined,
  error: undefined,
};

function stateForResult( result: any ) {
  return {
    isLoading: !Boolean( result ),
    data: undefined,
    pageInfo: undefined,
    error: undefined,
    ...( result ? result : {} ),
  };
}

export function createQueryInternal<
  Q extends InstaQLParams<Schema>,
  Schema extends InstantSchemaDef<any, any, any>,
>(
  _core: InstantCoreDatabase<Schema>,
  _query: null | Q,
  _opts?: InstaQLOptions,
): {
  state: InstaQLLifecycleState<Schema, Q>;
  query: any;
} {
  if ( _query && _opts && 'ruleParams' in _opts ) {
    _query = {$$ruleParams: _opts[ 'ruleParams' ], ..._query};
  }
  const query = _query ? coerceQuery( _query ) : null;
  const queryHash = weakHash( query );

  const [ state, setState ] = createSignal<InstaQLLifecycleState<Schema, Q>>(
    stateForResult( _core._reactor.getPreviousResult( query ) )
  );

  createEffect( () => {
    if ( !query ) return;

    const unsubscribe = _core.subscribeQuery<Q>( query, ( result ) => {
      setState( {
        isLoading: !Boolean( result ),
        data: undefined,
        pageInfo: undefined,
        error: undefined,
        ...result,
      } );
    } );

    onCleanup( () => unsubscribe() );
  } );

  return {state: state(), query};
}