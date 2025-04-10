import { describe, it, beforeEach, expect, vi } from "vitest"; // Ensure all Vitest globals are imported
import { createPresence } from "../src/hooks/createPresence";
import { createSignal, createRoot } from "solid-js";
import type { InstantSolidRoom } from "../src/InstantSolidRoom";

// Further expand mockReactor to include all required properties
const mockReactor = {
  getPresence: vi.fn(),
  subscribePresence: vi.fn( () => vi.fn() ),
  publishPresence: vi.fn(),
  attrs: {},
  _isOnline: true,
  _isShutdown: false,
  status: "connected",
  querySubs: {},
  pendingMutations: [],
  queryCbs: {},
  queryOnceDfds: {},
  authCbs: [],
  attrsCbs: [],
  mutationErrorCbs: [],
  connectionStatusCbs: [],
  config: {},
  _persister: {},
  mutationDeferredStore: {},
  _reconnectTimeoutId: null,
  // Add other required properties with mock implementations or default values
};

// Adjust mockAuth and mockStorage to remove private db property
const mockAuth = {
  sendMagicCode: vi.fn(),
  signInWithMagicCode: vi.fn(),
  signInWithToken: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createAuthorizationURL: vi.fn(),
  signInWithIdToken: vi.fn(),
  exchangeOAuthCode: vi.fn(),
  issuerURI: "mock-issuer-uri",
};

const mockStorage = {
  uploadFile: vi.fn(),
  delete: vi.fn(),
  upload: vi.fn(),
  getFile: vi.fn(),
  put: vi.fn(),
  getDownloadUrl: vi.fn(),
};

// Update the mockRoom to use the expanded auth and storage mocks
const mockRoom: InstantSolidRoom<any, any, any> = {
  id: "test-room",
  type: "test-type",
  _core: {
    _reactor: mockReactor,
    auth: mockAuth,
    storage: mockStorage,
    tx: {},
    transact: vi.fn(),
    subscribeAuth: vi.fn(),
    subscribeConnectionStatus: vi.fn(),
    queryOnce: vi.fn(),
    getLocalId: vi.fn(),
    subscribeQuery: vi.fn(),
    getPreviousResult: vi.fn(),
    joinRoom: vi.fn(),
    publishTopic: vi.fn(),
    subscribeTopic: vi.fn(),
  },
};

describe( "createPresence", () => {
  beforeEach( () => {
    vi.resetAllMocks();
    mockReactor.getPresence.mockReturnValue( {
      user: undefined,
      peers: {},
      isLoading: true,
      error: null,
    } );

    // Update subscribePresence mock implementation to match the expected signature
    mockReactor.subscribePresence.mockImplementation( ( _type: any, _id: any, _opts: any, callback: ( arg0: {} ) => void ) => {
      // Simulate subscription behavior
      callback( {} ); // Invoke the callback with an empty object as a mock update
      return vi.fn(); // Return a mock unsubscribe function
    } );
  } );

  it( "should initialize presence state and publish function", () => {
    createRoot( ( dispose ) => {
      const roomAccessor = () => mockRoom;
      const optsAccessor = () => ( { keys: [ "cursor" ] } ); // Removed 'as const' to make it mutable

      const presence = createPresence( roomAccessor, optsAccessor );

      expect( presence.isLoading ).toBe( true );
      expect( presence.peers ).toEqual( {} );
      expect( typeof presence.publishPresence ).toBe( "function" );

      expect( mockReactor.subscribePresence ).toHaveBeenCalledWith(
        "test-type",
        "test-room",
        { keys: [ "cursor" ] },
        expect.any( Function )
      );

      dispose();
    } );
  } );

  it( "should call reactor's publishPresence when publishPresence handle is called", () => {
    createRoot( ( dispose ) => {
      const roomAccessor = () => mockRoom;
      const optsAccessor = () => ( { keys: [ "cursor" ] } ); // Removed 'as const' to make it mutable

      const presence = createPresence( roomAccessor, optsAccessor );

      const presenceData = { cursor: { x: 10, y: 20 } };
      presence.publishPresence( presenceData );

      expect( mockReactor.publishPresence ).toHaveBeenCalledTimes( 1 );
      expect( mockReactor.publishPresence ).toHaveBeenCalledWith(
        "test-type",
        "test-room",
        presenceData
      );

      dispose();
    } );
  } );

  it( "should update presence state when subscription callback is invoked", () => {
    createRoot( ( dispose ) => {
      const roomAccessor = () => mockRoom;
      const optsAccessor = () => ( { keys: [ "cursor" ] } ); // Removed 'as const' to make it mutable
      let subscriptionCallback: ( data: any ) => void = () => { };

      mockReactor.subscribePresence.mockImplementation( ( _type: any, _id: any, _opts: any, callback: ( data: any ) => void, ..._rest: any[] ) => {
        subscriptionCallback = callback;
        return vi.fn();
      } );

      const presence = createPresence( roomAccessor, optsAccessor );

      const updateData = {
        peers: { "user-1": { cursor: { x: 5, y: 5 } } },
        user: { cursor: { x: 1, y: 1 } },
      };
      subscriptionCallback( updateData );

      expect( presence.isLoading ).toBe( false );
      expect( presence.peers ).toEqual( updateData.peers );
      expect( presence.user ).toEqual( updateData.user );

      dispose();
    } );
  } );
} );