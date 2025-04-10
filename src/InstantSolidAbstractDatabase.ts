// solidjs/src/InstantSolidAbstractDatabase.ts (Revised)
import {
  // types from @instantdb/core (remain the same)
  Auth,
  Storage,
  txInit,
  type AuthState,
  type User,
  type ConnectionStatus,
  type TransactionChunk,
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
  type RoomSchemaShape,
} from "@instantdb/core"; // Adjust path as needed
import {
  createSignal,
  createEffect,
  onCleanup,
  onMount,
  createResource, // Import createResource
  type Accessor,
} from "solid-js";

// Import the actual SolidJS query hook we just defined
import { createQuery } from "./hooks/createQuery"; // Correct path

// Import the SolidJS Room class and the rooms object
import { InstantSolidRoom } from "./InstantSolidRoom"; // Correct path
import { rooms as roomHooks } from "./rooms"; // Correct path and alias if needed

const defaultAuthState: AuthState = {
  isLoading: true,
  user: undefined,
  error: undefined,
};

// Renamed class for SolidJS context
export default abstract class InstantSolidAbstractDatabase<
  Schema extends InstantSchemaDef<any, any, any>,
  Rooms extends RoomSchemaShape = RoomsOf<Schema>,
> implements IInstantDatabase<Schema> {
  public tx = txInit<Schema>();

  public auth: Auth;
  public storage: Storage;
  public _core: InstantCoreDatabase<Schema>;

  // These likely remain the same, pointing to platform-specific implementations
  static Storage?: any;
  static NetworkListener?: any;

  constructor (
    config: InstantConfig<Schema>,
    versions?: { [ key: string ]: string; }
  ) {
    this._core = core_init<Schema>(
      config,
      // @ts-expect-error
      this.constructor.Storage,
      // @ts-expect-error
      this.constructor.NetworkListener,
      versions
    );
    this.auth = this._core.auth;
    this.storage = this._core.storage;
  }

  // Async instance method with error handling.
  getLocalId = async ( name: string ): Promise<string | undefined> => {
    try {
      return await this._core.getLocalId( name );
    } catch ( error ) {
      console.error( `Error fetching local ID for name "${name}":`, error );
      return undefined; // Return undefined or handle the error as needed
    }
  };

  // SolidJS hook using createResource for async data
  useLocalId = (
    name: Accessor<string> | string
  ): Accessor<string | undefined> => {
    // Normalize input to an accessor
    const nameAccessor = typeof name === "function" ? name : () => name;

    // Use createResource: source signal is nameAccessor, fetcher calls getLocalId
    const [ idResource ] = createResource<string | undefined, string>(
      nameAccessor, // Source: Re-fetches when this accessor's value changes
      async ( currentName ) => {
        // Fetcher: Takes the current source value
        if ( !currentName ) return undefined; // Handle empty name case if necessary
        return this.getLocalId( currentName );
      }
      // { initialValue: undefined } // Optional: Define initial value before first fetch
    );

    // createResource returns an accessor with loading/error states, but here we just want the data accessor
    return idResource;
  };

  // Instance method returning a Solid-compatible Room object
  room<RoomType extends keyof Rooms>(
    type: RoomType = "_defaultRoomType" as RoomType,
    id: string = "_defaultRoomId"
  ): InstantSolidRoom<Schema, Rooms, RoomType> {
    return new InstantSolidRoom<Schema, Rooms, RoomType>( this._core, type, id );
  }

  // Hooks for working with rooms - points to the imported rooms object
  rooms = roomHooks; // Assign the actual object

  // Instance method - no change needed
  transact = (
    chunks: TransactionChunk<any, any> | TransactionChunk<any, any>[]
  ): Promise<void> => {
    return this._core.transact( chunks );
  };

  // SolidJS hook for querying data using the imported createQuery hook
  useQuery = <Q extends InstaQLParams<Schema>>(
    // Query and opts can be static or reactive Accessors
    query: null | Q | Accessor<null | Q>,
    opts?: InstaQLOptions | Accessor<InstaQLOptions | undefined>
  ): Accessor<InstaQLLifecycleState<Schema, Q>> => {
    // Pass core and potentially reactive query/opts to the internal Solid hook
    return createQuery( this._core, query, opts );
  };

  // SolidJS hook for auth state (implementation seems reasonable, keeping it)
  useAuth = (): Accessor<AuthState> => {
    const [ authState, setAuthState ] = createSignal<AuthState>(
      defaultAuthState,
      { equals: false }
    ); // Use equals: false if object identity changes but value might be same

    onMount( () => {
      const initialState = this._core._reactor._currentUserCached;
      // Set initial state only if it differs from the default loading state
      if ( initialState.user !== undefined || initialState.error !== undefined ) {
        setAuthState( { isLoading: false, ...initialState } );
      }
    } );

    createEffect( () => {
      const unsubscribe = this._core.subscribeAuth( ( auth ) => {
        setAuthState( { isLoading: false, ...auth } );
      } );
      onCleanup( unsubscribe );
    } );

    return authState;
  };

  // Async instance method - no change needed
  getAuth(): Promise<User | null> {
    return this._core.getAuth();
  }

  // SolidJS hook for connection status (implementation seems reasonable, keeping it)
  useConnectionStatus = (): Accessor<ConnectionStatus> => {
    const [ status, setStatus ] = createSignal<ConnectionStatus>( "connecting" );

    onMount( () => {
      // Set initial status from core reactor on mount (client-side)
      setStatus( this._core._reactor.status as ConnectionStatus );
    } );

    createEffect( () => {
      const unsubscribe = this._core.subscribeConnectionStatus( ( newStatus ) => {
        // Update signal only if the status actually changed to avoid unnecessary reactions
        if ( newStatus !== status() ) {
          setStatus( newStatus );
        }
      } );
      onCleanup( unsubscribe );
    } );

    return status;
  };

  // Async instance method - no change needed
  queryOnce = <Q extends InstaQLParams<Schema>>(
    query: Q,
    opts?: InstaQLOptions
  ): Promise<{
    data: InstaQLResponse<Schema, Q>;
    pageInfo: PageInfoResponse<Q>;
  }> => {
    return this._core.queryOnce( query, opts );
  };
}
