// src/hooks/createTimeout.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot, onCleanup } from 'solid-js';
import { createTimeout } from '../src/hooks/index'; // Adjust path as necessary

describe( 'createTimeout', () => {
  beforeEach( () => {
    vi.useFakeTimers(); // Use Vitest's fake timers
  } );

  afterEach( () => {
    vi.restoreAllMocks(); // Restore original timers
  } );

  it( 'should return set and clear functions', () => {
    createRoot( dispose => {
      const timer = createTimeout();
      expect( typeof timer.set ).toBe( 'function' );
      expect( typeof timer.clear ).toBe( 'function' );
      dispose();
    } );
  } );

  it( 'should execute the function after the specified delay', () => {
    createRoot( dispose => {
      const timer = createTimeout();
      const mockFn = vi.fn();
      const delay = 1000;

      timer.set( delay, mockFn );

      // Should not be called immediately
      expect( mockFn ).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime( delay );

      // Should be called after the delay
      expect( mockFn ).toHaveBeenCalledTimes( 1 );
      dispose();
    } );
  } );

  it( 'should clear the timeout when clear is called', () => {
    createRoot( dispose => {
      const timer = createTimeout();
      const mockFn = vi.fn();
      const delay = 1000;

      timer.set( delay, mockFn );
      timer.clear();

      // Fast-forward time
      vi.advanceTimersByTime( delay );

      // Should not have been called because it was cleared
      expect( mockFn ).not.toHaveBeenCalled();
      dispose();
    } );
  } );

  it( 'should clear the timeout automatically on cleanup', () => {
    let timer: ReturnType<typeof createTimeout> | null = null;
    const mockFn = vi.fn();
    const mockClearTimeout = vi.spyOn( global, 'clearTimeout' );
    const delay = 1000;

    createRoot( dispose => {
      timer = createTimeout();
      timer.set( delay, mockFn );
      // Dispose will trigger onCleanup
      dispose();
    } );

    // Check if clearTimeout was called during cleanup
    expect( mockClearTimeout ).toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime( delay );

    // Should not have been called because cleanup cleared it
    expect( mockFn ).not.toHaveBeenCalled();
  } );

  it( 'should clear the previous timeout when set is called again', () => {
    createRoot( dispose => {
      const timer = createTimeout();
      const firstMockFn = vi.fn();
      const secondMockFn = vi.fn();
      const delay = 1000;

      timer.set( delay, firstMockFn );
      // Set a new timeout before the first one finishes
      timer.set( delay, secondMockFn );

      // Fast-forward time for the first timeout
      vi.advanceTimersByTime( delay );

      // First function should not have been called
      expect( firstMockFn ).not.toHaveBeenCalled();
      // Second function should have been called
      expect( secondMockFn ).toHaveBeenCalledTimes( 1 );

      // Fast-forward again (though the second one already ran)
      vi.advanceTimersByTime( delay );
      expect( secondMockFn ).toHaveBeenCalledTimes( 1 ); // Still called only once

      dispose();
    } );
  } );
} );