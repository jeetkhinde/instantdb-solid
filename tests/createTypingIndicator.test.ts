import { describe, it, expect } from "vitest";
import { createTypingIndicator } from "../src/hooks/createTypingIndicator";
import { createSignal, createRoot } from "solid-js";

describe( "createTypingIndicator", () => {
  it( "should initialize typing indicator state and publish function", () => {
    createRoot( ( dispose ) => {
      const [ room ] = createSignal( { id: "test-room" } );

      const typingIndicator = createTypingIndicator( room );

      expect( typingIndicator.isTyping ).toBe( false );
      expect( typeof typingIndicator.startTyping ).toBe( "function" );
      expect( typeof typingIndicator.stopTyping ).toBe( "function" );

      dispose();
    } );
  } );

  it( "should update typing state when startTyping and stopTyping are called", () => {
    createRoot( ( dispose ) => {
      const [ room ] = createSignal( { id: "test-room" } );

      const typingIndicator = createTypingIndicator( room );
      typingIndicator.startTyping();

      expect( typingIndicator.isTyping ).toBe( true );

      typingIndicator.stopTyping();

      expect( typingIndicator.isTyping ).toBe( false );

      dispose();
    } );
  } );
} );