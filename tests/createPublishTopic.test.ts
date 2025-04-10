// src/hooks/createPublishTopic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createPublishTopic } from '../src/hooks';
import type { InstantSolidRoom } from '../src/InstantSolidRoom'; // Adjust path

// --- Mocks ---
const mockPublishTopic = vi.fn();
const mockJoinRoom = vi.fn();
const mockReactor = {
  publishTopic: mockPublishTopic,
  joinRoom: mockJoinRoom,
  // Add other necessary mock methods/properties
};
const mockCore = { _reactor: mockReactor }; // Simplified mock core

// Mock Room
const createMockRoom = ( id: string, type: string ): InstantSolidRoom<any, any, any> => ( {
  id,
  type,
  _core: mockCore as any,
} );
// --- End Mocks ---

describe( 'createPublishTopic', () => {
  beforeEach( () => {
    vi.resetAllMocks();
  } );

  it( 'should return a publish function', () => {
    createRoot( dispose => {
      const roomAccessor = () => createMockRoom( 'room1', 'chat' );
      const topicAccessor = () => 'messages';

      const publish = createPublishTopic( roomAccessor, topicAccessor );
      expect( typeof publish ).toBe( 'function' );
      dispose();
    } );
  } );

  it( 'should call reactor.publishTopic when the returned function is invoked', () => {
    createRoot( dispose => {
      const roomAccessor = () => createMockRoom( 'room-abc', 'updates' );
      const topicAccessor = () => 'status';
      const publish = createPublishTopic( roomAccessor, topicAccessor );
      const dataToPublish = { text: 'hello', timestamp: Date.now() };

      publish( dataToPublish );

      expect( mockPublishTopic ).toHaveBeenCalledTimes( 1 );
      expect( mockPublishTopic ).toHaveBeenCalledWith( {
        roomType: 'updates',
        roomId: 'room-abc',
        topic: 'status',
        data: dataToPublish,
      } );
      dispose();
    } );
  } );

  it( 'should call reactor.joinRoom when the hook is initialized with a valid room', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room-join', 'presence' ) );
      const topicAccessor = () => 'events';

      createPublishTopic( room, topicAccessor );

      expect( mockJoinRoom ).toHaveBeenCalledTimes( 1 );
      expect( mockJoinRoom ).toHaveBeenCalledWith( 'room-join' );

      dispose();
    } );
  } );

  it( 'should call reactor.joinRoom when the room becomes available', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal<InstantSolidRoom<any, any, any> | null>( null );
      const topicAccessor = () => 'events';

      createPublishTopic( room, topicAccessor );
      expect( mockJoinRoom ).not.toHaveBeenCalled(); // Not called initially

      // Set a valid room
      setRoom( createMockRoom( 'room-late-join', 'data' ) );

      expect( mockJoinRoom ).toHaveBeenCalledTimes( 1 );
      expect( mockJoinRoom ).toHaveBeenCalledWith( 'room-late-join' );

      dispose();
    } );
  } );

  it( 'should call reactor.joinRoom again if the room changes', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal( createMockRoom( 'room-A', 'typeA' ) );
      const topicAccessor = () => 'events';

      createPublishTopic( room, topicAccessor );
      expect( mockJoinRoom ).toHaveBeenCalledTimes( 1 );
      expect( mockJoinRoom ).toHaveBeenCalledWith( 'room-A' );

      // Change the room
      setRoom( createMockRoom( 'room-B', 'typeB' ) );

      expect( mockJoinRoom ).toHaveBeenCalledTimes( 2 );
      expect( mockJoinRoom ).toHaveBeenCalledWith( 'room-B' ); // Called for the new room

      dispose();
    } );
  } );


  it( 'should not call reactor.publishTopic if room is null/undefined when publishing', () => {
    createRoot( dispose => {
      const [ room, setRoom ] = createSignal<InstantSolidRoom<any, any, any> | null>( null );
      const topicAccessor = () => 'messages';
      const publish = createPublishTopic( room, topicAccessor );
      const dataToPublish = { text: 'test' };

      // Suppress console.warn during this specific test
      const warnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => { } );

      publish( dataToPublish );

      expect( mockPublishTopic ).not.toHaveBeenCalled();
      expect( warnSpy ).toHaveBeenCalledWith(
        expect.stringContaining( "Cannot publish topic, room or topic is not available yet." )
      );

      warnSpy.mockRestore(); // Restore console.warn
      dispose();
    } );
  } );

  it( 'should not call reactor.publishTopic if topic is null/undefined when publishing', () => {
    createRoot( dispose => {
      const roomAccessor = () => createMockRoom( 'room1', 'chat' );
      const [ topic, setTopic ] = createSignal<string | null>( null );
      const publish = createPublishTopic( roomAccessor, () => topic() ?? 'defaultTopic' );
      const dataToPublish = { text: 'test' };

      const warnSpy = vi.spyOn( console, 'warn' ).mockImplementation( () => { } );

      publish( dataToPublish );

      expect( mockPublishTopic ).not.toHaveBeenCalled();
      expect( warnSpy ).toHaveBeenCalledWith(
        expect.stringContaining( "Cannot publish topic, room or topic is not available yet." )
      );

      warnSpy.mockRestore();
      dispose();
    } );
  } );
} );