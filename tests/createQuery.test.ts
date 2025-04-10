// src/hooks/createQuery.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot, createSignal, onCleanup } from 'solid-js';
import { createQuery } from '../src/hooks'; // Adjust path
import { weakHash, coerceQuery } from "@instantdb/core"; // Import necessary core functions


// --- Mocks ---
const mockUnsubscribe = vi.fn();
const mockSubscribeQuery = vi.fn( () => mockUnsubscribe );
const mockGetPreviousResult = vi.fn( () => undefined ); // Default to no cached result
const mockReactor = {
  subscribeQuery: mockSubscribeQuery,
  getPreviousResult: mockGetPreviousResult,
  // Add other necessary mock methods/properties
};

// Mock Core DB
const mockCore = {
  _reactor: mockReactor,
  // Add other necessary mock methods/properties
};

// Mock coerceQuery and weakHash (if needed, or use actual implementations)
vi.mock( '@instantdb/core', async ( importOriginal ) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    coerceQuery: vi.fn( ( q ) => ( { ...q, __coerced: true } ) ), // Simple mock
    weakHash: vi.fn( ( q ) => JSON.stringify( q ) ), // Simple mock hash
  };
} );
// --- End Mocks ---


describe( 'createQuery', () => {
  beforeEach( () => {
    vi.resetAllMocks();
    // Reset mocks specifically for each test
    mockGetPreviousResult.mockReturnValue( undefined );
    ( coerceQuery as ReturnType<typeof vi.fn> ).mockImplementation( ( q ) => q ? ( { ...q, __coerced: true } ) : null );
    ( weakHash as ReturnType<typeof vi.fn> ).mockImplementation( ( q ) => q ? JSON.stringify( q ) : 'null' );

  } );

  it( 'should return state and query accessors', () => {
    createRoot( dispose => {
      const queryDef = { tasks: {} };
      const { state, query } = createQuery( mockCore as any, queryDef );

      expect( typeof state ).toBe( 'function' );
      expect( typeof query ).toBe( 'function' );
      expect( state() ).toBeDefined();
      expect( query() ).toBeDefined();

      dispose();
    } );
  } );

  it( 'should initialize with isLoading: true if no cached result', () => {
    createRoot( dispose => {
      const queryDef = { projects: {} };
      mockGetPreviousResult.mockReturnValue( undefined ); // Ensure no cache

      const { state } = createQuery( mockCore as any, queryDef );

      expect( state().isLoading ).toBe( true );
      expect( state().data ).toBeUndefined();
      expect( state().error ).toBeUndefined();

      dispose();
    } );
  } );

  it( 'should initialize with cached result if available', () => {
    createRoot( dispose => {
      const queryDef = { users: { where: { active: true } } };
      const cachedResult = {
        data: [ { id: 'user1', name: 'Alice' } ],
        isLoading: false, // Cache implies it was loaded before
        error: undefined,
        pageInfo: {},
      };
      mockGetPreviousResult.mockReturnValue( cachedResult );

      const { state } = createQuery( mockCore as any, queryDef );

      expect( state().isLoading ).toBe( false ); // Should reflect cached state
      expect( state().data ).toEqual( cachedResult.data );
      expect( state().error ).toBeUndefined();

      dispose();
    } );
  } );

  it( 'should call subscribeQuery with the coerced query', () => {
    createRoot( dispose => {
      const queryDef = { documents: {} };
      const coercedQuery = { documents: {}, __coerced: true }; // Expected coerced form
      ( coerceQuery as ReturnType<typeof vi.fn> ).mockReturnValue( coercedQuery );

      createQuery( mockCore as any, queryDef );

      expect( coerceQuery ).toHaveBeenCalledWith( queryDef );
      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeQuery ).toHaveBeenCalledWith( coercedQuery, expect.any( Function ) );

      dispose();
    } );
  } );

  it( 'should update state when subscription callback fires', () => {
    let capturedCallback: ( ( result: any ) => void ) | null = null;
    mockSubscribeQuery.mockImplementation( ( query, callback ) => {
      capturedCallback = callback;
      return mockUnsubscribe;
    } );

    createRoot( dispose => {
      const queryDef = { items: {} };
      const { state } = createQuery( mockCore as any, queryDef );

      expect( state().isLoading ).toBe( true ); // Starts loading

      // Simulate receiving data
      const resultUpdate = {
        data: [ { id: 'item1', value: 100 } ],
        isLoading: false,
        error: undefined,
        pageInfo: {}
      };
      capturedCallback!( resultUpdate );

      expect( state().isLoading ).toBe( false );
      expect( state().data ).toEqual( resultUpdate.data );
      expect( state().error ).toBeUndefined();

      dispose();
    } );
  } );

  it( 'should unsubscribe on cleanup', () => {
    createRoot( dispose => {
      const queryDef = { posts: {} };
      createQuery( mockCore as any, queryDef );

      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 1 );

      // Trigger cleanup
      dispose();

      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
    } );
  } );

  it( 'should handle null query input', () => {
    createRoot( dispose => {
      const { state, query } = createQuery( mockCore as any, null );

      expect( query() ).toBeNull();
      expect( state().isLoading ).toBe( true ); // Default state
      expect( state().data ).toBeUndefined();
      expect( mockSubscribeQuery ).not.toHaveBeenCalled(); // No subscription for null query

      dispose();
    } );
  } );

  it( 'should handle reactive query changes', () => {
    createRoot( dispose => {
      const [ queryDef, setQueryDef ] = createSignal<object | null>( { tasks: { where: { status: 'pending' } } } );
      const coercedPending = { tasks: { where: { status: 'pending' } }, __coerced: true };
      const coercedDone = { tasks: { where: { status: 'done' } }, __coerced: true };
      const hashPending = JSON.stringify( coercedPending );
      const hashDone = JSON.stringify( coercedDone );

      ( coerceQuery as ReturnType<typeof vi.fn> )
        .mockImplementation( q => q?.tasks?.where?.status === 'pending' ? coercedPending : ( q?.tasks?.where?.status === 'done' ? coercedDone : null ) );
      ( weakHash as ReturnType<typeof vi.fn> )
        .mockImplementation( q => q?.tasks?.where?.status === 'pending' ? hashPending : ( q?.tasks?.where?.status === 'done' ? hashDone : 'null' ) );


      const { state, query } = createQuery( mockCore as any, queryDef );

      // Initial subscription
      expect( query() ).toEqual( coercedPending );
      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeQuery ).toHaveBeenCalledWith( coercedPending, expect.any( Function ) );

      // Change the query
      setQueryDef( { tasks: { where: { status: 'done' } } } );

      // Should unsubscribe from old and subscribe to new
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
      expect( query() ).toEqual( coercedDone );
      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 2 );
      expect( mockSubscribeQuery ).toHaveBeenCalledWith( coercedDone, expect.any( Function ) );

      // Change query to null
      setQueryDef( null );

      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 2 ); // Unsubscribed from 'done' query
      expect( query() ).toBeNull();
      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 2 ); // No new subscription for null
      expect( state().isLoading ).toBe( true ); // Resets to default

      dispose();
      // Final unsubscribe on root disposal
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 2 ); // No extra unsub for null query state
    } );
  } );

  it( 'should include ruleParams in coerced query if provided via opts', () => {
    createRoot( dispose => {
      const queryDef = { protectedDocs: {} };
      const opts = { ruleParams: { userId: 'user-123' } };
      const expectedCoercedQuery = { $$ruleParams: opts.ruleParams, ...queryDef, __coerced: true };

      ( coerceQuery as ReturnType<typeof vi.fn> ).mockImplementation( q => {
        // Basic check if ruleParams are present
        if ( q && q.$$ruleParams?.userId === 'user-123' ) {
          return expectedCoercedQuery;
        }
        return { ...q, __coerced: true }; // fallback mock
      } );


      createQuery( mockCore as any, queryDef, opts );

      // Check that coerceQuery was called with ruleParams included
      expect( coerceQuery ).toHaveBeenCalledWith( expect.objectContaining( {
        $$ruleParams: { userId: 'user-123' },
        protectedDocs: {},
      } ) );

      // Check subscription uses the correctly coerced query
      expect( mockSubscribeQuery ).toHaveBeenCalledWith( expectedCoercedQuery, expect.any( Function ) );

      dispose();
    } );
  } );

  it( 'should handle reactive opts changes (affecting ruleParams)', () => {
    createRoot( dispose => {
      const queryDef = { protectedDocs: {} };
      const [ opts, setOpts ] = createSignal<{ ruleParams?: any; } | undefined>( { ruleParams: { userId: 'user-A' } } );

      const expectedCoercedA = { $$ruleParams: { userId: 'user-A' }, ...queryDef, __coerced: true };
      const expectedCoercedB = { $$ruleParams: { userId: 'user-B' }, ...queryDef, __coerced: true };

      ( coerceQuery as ReturnType<typeof vi.fn> ).mockImplementation( q => {
        if ( q?.$$ruleParams?.userId === 'user-A' ) return expectedCoercedA;
        if ( q?.$$ruleParams?.userId === 'user-B' ) return expectedCoercedB;
        return { ...q, __coerced: true }; // fallback
      } );
      ( weakHash as ReturnType<typeof vi.fn> ).mockImplementation( q => JSON.stringify( q ) );


      createQuery( mockCore as any, queryDef, opts );

      // Initial subscription
      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeQuery ).toHaveBeenCalledWith( expectedCoercedA, expect.any( Function ) );

      // Change opts
      setOpts( { ruleParams: { userId: 'user-B' } } );

      // Should unsubscribe and re-subscribe with new coerced query
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 2 );
      expect( mockSubscribeQuery ).toHaveBeenCalledWith( expectedCoercedB, expect.any( Function ) );


      dispose();
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 2 );
    } );
  } );
} );