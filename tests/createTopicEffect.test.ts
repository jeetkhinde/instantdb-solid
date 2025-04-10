// src/hooks/createTopicEffect.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot, createSignal, onCleanup } from 'solid-js';
import { createTopicEffect } from '../src/hooks';
import type { InstantSolidRoom } from '../src/InstantSolidRoom'; // Adjust path

// --- Mocks ---
const mockUnsubscribe = vi.fn();
const mockSubscribeTopic = vi.fn( () => mockUnsubscribe );
const mockReactor = {
  subscribeTopic: mockSubscribeTopic,
  // Add other necessary mock methods/properties if needed by the hook indirectly
};

// Simplified mock core DB
const mockCore = {
  _reactor: mockReactor,
  // Add other necessary mock methods/properties
};

// Mock Room - Adjust schema types as needed for your tests
const createMockRoom = ( id: string, type: string ): InstantSolidRoom<any, any, any> => ( {
  id,
  type,
  _core: mockCore as any, // Use 'as any' for simplicity in mock
} );
// --- End Mocks ---


describe( 'createTopicEffect', () => {
  beforeEach( () => {
    vi.resetAllMocks();
  } );

  it( 'should subscribe to the topic when room and topic are valid', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room1', 'chat' ) );
      const [ topic, setTopic ] = createSignal( 'messages' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );

      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeTopic ).toHaveBeenCalledWith( 'room1', 'messages', expect.any( Function ) );

      dispose();
    } );
  } );

  it( 'should not subscribe if room is initially null/undefined', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal<InstantSolidRoom<any, any, any> | null>( null );
      const [ topic, setTopic ] = createSignal( 'messages' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );

      expect( mockSubscribeTopic ).not.toHaveBeenCalled();

      dispose();
    } );
  } );

  it( 'should subscribe when room becomes available', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal<InstantSolidRoom<any, any, any> | null>( null );
      const [ topic, setTopic ] = createSignal( 'messages' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );
      expect( mockSubscribeTopic ).not.toHaveBeenCalled(); // Not called initially

      // Set a valid room
      setRoom( createMockRoom( 'room2', 'updates' ) );

      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeTopic ).toHaveBeenCalledWith( 'room2', 'messages', expect.any( Function ) );


      dispose();
    } );
  } );

  it( 'should call onEvent when the subscription callback fires', () => {
    let capturedCallback: ( ( event: any, peer: any ) => void ) | null = null;
    mockSubscribeTopic.mockImplementation( ( roomId, topicName, callback ) => {
      capturedCallback = callback;
      return mockUnsubscribe;
    } );

    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room1', 'chat' ) );
      const [ topic, setTopic ] = createSignal( 'reactions' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );

      expect( capturedCallback ).toBeInstanceOf( Function );

      // Simulate an event coming from the subscription
      const mockEventData = { type: 'emoji', value: '👍' };
      const mockPeerData = { id: 'peer1', name: 'Alice' };
      capturedCallback!( mockEventData, mockPeerData );

      expect( onEvent ).toHaveBeenCalledTimes( 1 );
      expect( onEvent ).toHaveBeenCalledWith( mockEventData, mockPeerData );

      dispose();
    } );
  } );

  it( 'should unsubscribe on cleanup', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room1', 'chat' ) );
      const [ topic, setTopic ] = createSignal( 'messages' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );
      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 1 );

      // Trigger cleanup
      dispose();

      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
    } );
  } );

  it( 'should re-subscribe when the room changes', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room1', 'chat' ) );
      const [ topic, setTopic ] = createSignal( 'messages' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );
      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeTopic ).toHaveBeenCalledWith( 'room1', 'messages', expect.any( Function ) );
      expect( mockUnsubscribe ).not.toHaveBeenCalled();

      // Change the room
      setRoom( createMockRoom( 'room2', 'updates' ) );

      // Should unsubscribe from the old room and subscribe to the new one
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 2 );
      expect( mockSubscribeTopic ).toHaveBeenCalledWith( 'room2', 'messages', expect.any( Function ) );


      dispose();
      // Final unsubscribe on root disposal
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 2 );
    } );
  } );

  it( 'should re-subscribe when the topic changes', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room1', 'chat' ) );
      const [ topic, setTopic ] = createSignal( 'messages' );
      const onEvent = vi.fn();

      createTopicEffect( room, topic, onEvent );
      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeTopic ).toHaveBeenCalledWith( 'room1', 'messages', expect.any( Function ) );

      // Change the topic
      setTopic( 'reactions' );

      // Should unsubscribe from the old topic and subscribe to the new one
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 1 );
      expect( mockSubscribeTopic ).toHaveBeenCalledTimes( 2 );
      expect( mockSubscribeTopic ).toHaveBeenCalledWith( 'room1', 'reactions', expect.any( Function ) );

      dispose();
      // Final unsubscribe on root disposal
      expect( mockUnsubscribe ).toHaveBeenCalledTimes( 2 );
    } );
  } );
} );