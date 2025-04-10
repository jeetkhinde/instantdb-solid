import {createSignal, onCleanup} from 'solid-js';

export function createTimeout() {
  let timeoutRef: ReturnType<typeof setTimeout> | null = null;

  const set = ( delay: number, fn: () => void ) => {
    clearTimeout( timeoutRef! );
    timeoutRef = setTimeout( fn, delay );
  };

  const clear = () => {
    clearTimeout( timeoutRef! );
  };

  onCleanup( () => clear() );

  return {set, clear};
}