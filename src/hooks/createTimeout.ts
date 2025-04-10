// src/createTimeout.ts
import { onCleanup } from "solid-js";

// Define the interface for the returned object
interface TimeoutControls {
  set: ( delay: number, fn: () => void ) => void;
  clear: () => void;
}

/**
 * Creates a timeout manager that automatically clears the timeout
 * when the reactive scope is disposed.
 *
 * @returns {TimeoutControls} An object with `set` and `clear` functions.
 */
export function createTimeout(): TimeoutControls {
  // Use `number` for browser environments or `ReturnType<typeof setTimeout> | null` for NodeJS compatibility
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if ( timeoutId !== null ) {
      clearTimeout( timeoutId );
      timeoutId = null;
    }
  };

  const set = ( delay: number, fn: () => void ) => {
    clear(); // Clear any existing timeout before setting a new one
    timeoutId = setTimeout( () => {
      timeoutId = null; // Clear ref after execution
      fn();
    }, delay );
  };

  // Automatically clear the timeout when the component/scope unmounts
  onCleanup( () => {
    clear();
  } );

  return { set, clear };
}

// Example Usage (within a SolidJS component or createRoot scope):
/*
import { createSignal, onMount } from 'solid-js';
import { createTimeout } from './createTimeout';

function MyComponent() {
  const [message, setMessage] = createSignal("Waiting...");
  const timer = createTimeout(); // Create the timeout manager

  onMount(() => {
    setMessage("Timer started...");
    timer.set(3000, () => {
      setMessage("Timeout finished!");
    });
  });

  return (
    <div>
      <p>{message()}</p>
      <button onClick={() => timer.clear()}>Cancel Timeout</button>
    </div>
  );
}
*/
