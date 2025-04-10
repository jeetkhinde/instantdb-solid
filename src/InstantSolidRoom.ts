/**
 * SolidJS hooks and class for managing room presence, topics, and typing indicators.
 * These hooks are designed to work with the InstantDB library.
 */

import {createSignal, createEffect, onCleanup} from 'solid-js';
import {createTimeout} from './createTimeout';

export const defaultActivityStopTimeout = 1_000;

// ------
// Topics

/**
 * Listen for broadcasted events given a room and topic.
 *
 * @example
 * const room = db.room('chats', roomId);
 * createTopicEffect(room, 'emoji', (message, peer) => {
 *   console.log(peer.name, 'sent', message);
 * });
 *
 * @param room - The room instance.
 * @param topic - The topic to listen to.
 * @param onEvent - Callback for handling events.
 */
export function createTopicEffect( room, topic, onEvent ) {
  createEffect( () => {
    const unsub = room._core._reactor.subscribeTopic(
      room.id,
      topic,
      ( event, peer ) => {
        onEvent( event, peer );
      }
    );

    onCleanup( unsub );
  } );
}

/**
 * Broadcast an event to a room.
 *
 * @example
 * const room = db.room('chat', roomId);
 * const publishTopic = createPublishTopic(room, 'emoji');
 * publishTopic({ emoji: '🔥' });
 *
 * @param room - The room instance.
 * @param topic - The topic to broadcast to.
 * @returns A function to publish data to the topic.
 */
export function createPublishTopic( room, topic ) {
  createEffect( () => room._core._reactor.joinRoom( room.id ) );

  return ( data ) => {
    room._core._reactor.publishTopic( {
      roomType: room.type,
      roomId: room.id,
      topic,
      data,
    } );
  };
}

// ---------
// Presence

/**
 * Listen for peer's presence data in a room, and publish the current user's presence.
 *
 * @example
 * const { peers, publishPresence } = createPresence(room, { keys: ['name', 'avatar'] });
 *
 * @param room - The room instance.
 * @param opts - Options for presence data.
 * @returns An object containing peers and a function to publish presence data.
 */
export function createPresence( room, opts = {} ) {
  const [ state, setState ] = createSignal(
    room._core._reactor.getPresence( room.type, room.id, opts ) ?? {
      peers: {},
      isLoading: true,
    }
  );

  createEffect( () => {
    const unsub = room._core._reactor.subscribePresence(
      room.type,
      room.id,
      opts,
      ( data ) => {
        setState( data );
      }
    );

    onCleanup( unsub );
  } );

  const publishPresence = ( data ) => {
    room._core._reactor.publishPresence( room.type, room.id, data );
  };

  return {
    ...state(),
    publishPresence,
  };
}

/**
 * Publishes presence data to a room.
 *
 * @example
 * createSyncPresence(room, { nickname });
 *
 * @param room - The room instance.
 * @param data - Presence data to sync.
 * @param deps - Dependencies for the effect.
 */
export function createSyncPresence( room, data, deps = [] ) {
  createEffect( () => room._core._reactor.joinRoom( room.id ) );

  createEffect( () => {
    room._core._reactor.publishPresence( room.type, room.id, data );
  }, deps );
}

// -----------------
// Typing Indicator

/**
 * Manage typing indicator state.
 *
 * @example
 * const { active, setActive, inputProps } = createTypingIndicator(room, 'chat-input');
 *
 * @param room - The room instance.
 * @param inputName - The input field name.
 * @param opts - Options for the typing indicator.
 * @returns An object containing active state, setActive function, and inputProps.
 */
export function createTypingIndicator( room, inputName, opts = {} ) {
  const timeout = createTimeout();

  const observedPresence = createPresence( room, {
    keys: [ inputName ],
  } );

  const active = () => {
    const presenceSnapshot = room._core._reactor.getPresence(
      room.type,
      room.id
    );

    return opts?.writeOnly
      ? []
      : Object.values( presenceSnapshot?.peers ?? {} ).filter(
        ( p ) => p[ inputName ] === true
      );
  };

  const setActive = ( isActive ) => {
    room._core._reactor.publishPresence( room.type, room.id, {
      [ inputName ]: isActive,
    } );

    if ( !isActive ) return;

    if ( opts?.timeout === null || opts?.timeout === 0 ) return;

    timeout.set( opts?.timeout ?? defaultActivityStopTimeout, () => {
      room._core._reactor.publishPresence( room.type, room.id, {
        [ inputName ]: null,
      } );
    } );
  };

  const onKeyDown = ( e ) => {
    const isEnter = opts?.stopOnEnter && e.key === 'Enter';
    const isActive = !isEnter;

    setActive( isActive );
  };

  const onBlur = () => {
    setActive( false );
  };

  const inputProps = {
    onKeyDown,
    onBlur,
  };

  return {
    active: active(),
    setActive,
    inputProps,
  };
}

// --------------
// Hooks

export const rooms = {
  createTopicEffect,
  createPublishTopic,
  createPresence,
  createSyncPresence,
  createTypingIndicator,
};

// ------------
// Class

export class InstantSolidRoom {
  _core;
  type;
  id;

  constructor ( _core, type, id ) {
    this._core = _core;
    this.type = type;
    this.id = id;
  }

  createTopicEffect( topic, onEvent ) {
    rooms.createTopicEffect( this, topic, onEvent );
  }

  createPublishTopic( topic ) {
    return rooms.createPublishTopic( this, topic );
  }

  createPresence( opts = {} ) {
    return rooms.createPresence( this, opts );
  }

  createSyncPresence( data, deps = [] ) {
    return rooms.createSyncPresence( this, data, deps );
  }

  createTypingIndicator( inputName, opts = {} ) {
    return rooms.createTypingIndicator( this, inputName, opts );
  }
}