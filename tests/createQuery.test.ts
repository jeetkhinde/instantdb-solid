// src/hooks/createQuery.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createQuery } from '../src/hooks';
import { weakHash, coerceQuery } from "@instantdb/core";

// --- Mocks ---
const mockUnsubscribe = vi.fn();
const mockSubscribeQuery = vi.fn( () => mockUnsubscribe );
const mockGetPreviousResult = vi.fn( () => undefined );
const mockReactor = {
  subscribeQuery: mockSubscribeQuery,
  getPreviousResult: mockGetPreviousResult,
};
const mockCore = { _reactor: mockReactor };

vi.mock( '@instantdb/core', async ( importOriginal ) => {
  const original = await importOriginal();
  return {
    ...original,
    coerceQuery: vi.fn( ( q ) => ( { ...q, __coerced: true } ) ),
    weakHash: vi.fn( ( q ) => JSON.stringify( q ) ),
  };
} );

// --- Tests ---
describe( 'createQuery', () => {
  beforeEach( () => {
    vi.resetAllMocks();
    mockGetPreviousResult.mockReturnValue( undefined );
  } );

  describe( 'Initialization', () => {
    it( 'should return state and query accessors', () => {
      createRoot( ( dispose ) => {
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
      createRoot( ( dispose ) => {
        const queryDef = { projects: {} };
        const { state } = createQuery( mockCore as any, queryDef );

        expect( state().isLoading ).toBe( true );
        expect( state().data ).toBeUndefined();
        expect( state().error ).toBeUndefined();

        dispose();
      } );
    } );

    it( 'should initialize with cached result if available', () => {
      createRoot( ( dispose ) => {
        const queryDef = { users: { where: { active: true } } };
        const cachedResult = {
          data: [ { id: 'user1', name: 'Alice' } ],
          isLoading: false,
          error: undefined,
          pageInfo: {},
        };
        mockGetPreviousResult.mockReturnValue( cachedResult );

        const { state } = createQuery( mockCore as any, queryDef );

        expect( state().isLoading ).toBe( false );
        expect( state().data ).toEqual( cachedResult.data );
        expect( state().error ).toBeUndefined();

        dispose();
      } );
    } );
  } );

  describe( 'Subscriptions', () => {
    it( 'should call subscribeQuery with the coerced query', () => {
      createRoot( ( dispose ) => {
        const queryDef = { documents: {} };
        const coercedQuery = { documents: {}, __coerced: true };
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

      createRoot( ( dispose ) => {
        const queryDef = { items: {} };
        const { state } = createQuery( mockCore as any, queryDef );

        expect( state().isLoading ).toBe( true );

        const resultUpdate = {
          data: [ { id: 'item1', value: 100 } ],
          isLoading: false,
          error: undefined,
          pageInfo: {},
        };

        capturedCallback!( resultUpdate );

        expect( state().isLoading ).toBe( false );
        expect( state().data ).toEqual( resultUpdate.data );
        expect( state().error ).toBeUndefined();

        dispose();
      } );
    } );

    it( 'should unsubscribe on cleanup', () => {
      createRoot( ( dispose ) => {
        const queryDef = { posts: {} };
        createQuery( mockCore as any, queryDef );

        expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 1 );

        dispose();

        expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
      } );
    } );
  } );

  describe( 'Reactive Behavior', () => {
    it( 'should handle null query input', () => {
      createRoot( ( dispose ) => {
        const { state, query } = createQuery( mockCore as any, null );

        expect( query() ).toBeNull();
        expect( state().isLoading ).toBe( true );
        expect( state().data ).toBeUndefined();
        expect( mockSubscribeQuery ).not.toHaveBeenCalled();

        dispose();
      } );
    } );

    it( 'should handle reactive query changes', () => {
      createRoot( ( dispose ) => {
        const [ queryDef, setQueryDef ] = createSignal<object | null>( { tasks: { where: { status: 'pending' } } } );
        const coercedPending = { tasks: { where: { status: 'pending' } }, __coerced: true };
        const coercedDone = { tasks: { where: { status: 'done' } }, __coerced: true };

        ( coerceQuery as ReturnType<typeof vi.fn> )
          .mockImplementation( ( q ) => ( q?.tasks?.where?.status === 'pending' ? coercedPending : coercedDone ) );

        const { state, query } = createQuery( mockCore as any, queryDef );

        expect( query() ).toEqual( coercedPending );
        expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 1 );

        setQueryDef( { tasks: { where: { status: 'done' } } } );

        expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
        expect( query() ).toEqual( coercedDone );
        expect( mockSubscribeQuery ).toHaveBeenCalledTimes( 2 );

        dispose();
      } );
    } );
  } );
} );