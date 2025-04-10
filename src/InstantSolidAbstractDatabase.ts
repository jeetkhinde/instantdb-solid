import {createSignal, createEffect, onCleanup} from 'solid-js';

import {
  Auth,
  Storage,
  txInit,
  type AuthState,
  type User,
  type ConnectionStatus,
  type TransactionChunk,
  type PresenceOpts,
  type PresenceResponse,
  type RoomSchemaShape,
  type InstaQLParams,
  type InstaQLOptions,
  type InstantConfig,
  type PageInfoResponse,
  InstantCoreDatabase,
  init as core_init,
  InstaQLLifecycleState,
  InstaQLResponse,
  RoomsOf,
  InstantSchemaDef,
  IInstantDatabase,
} from '@instantdb/core';

import {InstantSolidRoom} from './InstantSolidRoom';
import {createQueryInternal} from './createQueryInternal';

export default abstract class InstantSolidAbstractDatabase<
  Schema extends InstantSchemaDef<any, any, any>,
  Rooms extends RoomSchemaShape = RoomsOf<Schema>,
> implements IInstantDatabase<Schema> {
  public tx = txInit<Schema>();

  public auth: Auth;
  public storage: Storage;
  public _core: InstantCoreDatabase<Schema>;

  static Storage?: any;
  static NetworkListener?: any;

  constructor (
    config: InstantConfig<Schema>,
    versions?: {[ key: string ]: string;},
  ) {
    this._core = core_init<Schema>(
      config,
      this.constructor.Storage,
      this.constructor.NetworkListener,
      versions,
    );
    this.auth = this._core.auth;
    this.storage = this._core.storage;
  }

  getLocalId = ( name: string ): Promise<string> => {
    return this._core.getLocalId( name );
  };

  useLocalId = ( name: string ): string | null => {
    const [ localId, setLocalId ] = createSignal<string | null>( null );

    createEffect( () => {
      let mounted = true;
      const f = async () => {
        const id = await this.getLocalId( name );
        if ( !mounted ) return;
        setLocalId( id );
      };
      f();
      onCleanup( () => ( mounted = false ) );
    } );

    return localId();
  };

  room<RoomType extends keyof Rooms>(
    type: RoomType = '_defaultRoomType' as RoomType,
    id: string = '_defaultRoomId',
  ) {
    return new InstantSolidRoom<Schema, Rooms, RoomType>( this._core, type, id );
  }

  rooms = {}; // Initialize as an empty object or provide the correct implementation

  transact = (
    chunks: TransactionChunk<any, any> | TransactionChunk<any, any>[],
  ) => {
    return this._core.transact( chunks );
  };

  useQuery = <Q extends InstaQLParams<Schema>>(
    query: null | Q,
    opts?: InstaQLOptions,
  ): InstaQLLifecycleState<Schema, Q> => {
    return createQueryInternal( this._core, query, opts ).state;
  };

  useAuth = (): AuthState => {
    const resultCacheRef = this._core._reactor._currentUserCached;
    const [ state, setState ] = createSignal<AuthState>( resultCacheRef );

    createEffect( () => {
      const unsubscribe = this._core.subscribeAuth( ( auth ) => {
        setState( {isLoading: false, ...auth} );
      } );
      onCleanup( () => unsubscribe() );
    } );

    return state();
  };

  getAuth(): Promise<User | null> {
    return this._core.getAuth();
  }

  useConnectionStatus = (): ConnectionStatus => {
    const statusRef = this._core._reactor.status as ConnectionStatus;
    const [ status, setStatus ] = createSignal<ConnectionStatus>( statusRef );

    createEffect( () => {
      const unsubscribe = this._core.subscribeConnectionStatus( ( newStatus ) => {
        if ( newStatus !== statusRef ) {
          setStatus( newStatus );
        }
      } );
      onCleanup( () => unsubscribe() );
    } );

    return status();
  };

  queryOnce = <Q extends InstaQLParams<Schema>>(
    query: Q,
    opts?: InstaQLOptions,
  ): Promise<{
    data: InstaQLResponse<Schema, Q>;
    pageInfo: PageInfoResponse<Q>;
  }> => {
    return this._core.queryOnce( query, opts );
  };
}