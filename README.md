# @instantdb/solid

SolidJS integration for [InstantDB](https://instantdb.com/), providing reactive primitives for real-time database interactions.

## Installation

```bash
npm install @instantdb/solid @instantdb/core solid-js
```

## Quick Start

```jsx
import { createSignal } from 'solid-js';
import { init } from '@instantdb/solid';

// Initialize the database
const db = init({ 
  appId: 'YOUR_APP_ID' 
});

function App() {
  // Use authentication state
  const auth = db.useAuth();

  // Query data reactively
  const { state } = db.useQuery({ 
    tasks: { where: { completed: false } } 
  });

  return (
    <div>
      {auth().isLoading ? (
        <p>Loading auth...</p>
      ) : auth().user ? (
        <div>
          <p>Welcome {auth().user.email}</p>
          <TaskList tasks={state().data?.tasks} />
        </div>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
```

## Features

- 🔄 **Fully Reactive**: Built specifically for SolidJS's fine-grained reactivity system
- 🧩 **Composable Primitives**: Use standalone primitives like `createTopicEffect`, `createPresence`, `createSyncPresence`, and `createTypingIndicator`
- 🔌 **Real-time**: Automatic real-time updates when data changes
- 🌐 **Presence & Topics**: Built-in support for user presence and pub/sub topics

## Core Primitives

### Database Operations

```jsx
// Query data
const { state } = db.useQuery({ posts: {} });

// Get a room instance
const room = db.room('chats', 'room-123');

// Create a new entity
await db.tx.posts.create({
  title: 'Hello SolidJS!',
  content: 'This is my first post'
});
```

### Real-time Collaboration

```jsx
function ChatRoom(props) {
  const db = useInstant();
  const room = () => db.room('chats', props.roomId);

  // Subscribe to emoji reactions
  createTopicEffect(
    room,
    () => 'emoji',
    (emoji, peer) => {
      console.log(`${peer.name} sent emoji: ${emoji}`);
    }
  );

  // Get a function to publish to a topic
  const sendEmoji = createPublishTopic(
    room,
    () => 'emoji'
  );

  return (
    <div>
      <button onClick={() => sendEmoji('👍')}>👍</button>
      <button onClick={() => sendEmoji('❤️')}>❤️</button>
    </div>
  );
}
```

### User Presence

```jsx
function UserPresence() {
  const db = useInstant();
  const room = () => db.room('app', 'main');

  // Track user presence
  const presence = createPresence(room);

  // Sync user status
  createSyncPresence(
    room, 
    () => ({ 
      status: 'online',
      lastSeen: new Date()
    })
  );

  // Create typing indicator
  const typing = createTypingIndicator(
    room,
    () => 'typing',
    { timeout: 2000 }
  );

  return (
    <div>
      <p>Online users: {Object.keys(presence.peers).length}</p>
      <input 
        {...typing.inputProps()}
        placeholder="Type a message..."
      />
      {typing.active().length > 0 && (
        <p>Someone is typing...</p>
      )}
    </div>
  );
}
```

### Typing Indicator

```jsx
function TypingIndicatorExample() {
  const db = useInstant();
  const room = () => db.room('chat', 'room-123');

  const typing = createTypingIndicator(
    room,
    () => 'chat-input',
    { timeout: 3000 }
  );

  return (
    <div>
      <input 
        {...typing.inputProps()}
        placeholder="Type a message..."
      />
      {typing.active().length > 0 && (
        <p>Someone is typing...</p>
      )}
    </div>
  );
}
```

### Cursor Management

```jsx
import { Cursors } from '@instantdb/solid';

function CursorExample() {
  const db = useInstant();
  const room = db.room('example', 'room-1');

  return (
    <Cursors
      room={room}
      userCursorColor="blue"
      renderCursor={({ color }) => (
        <div style={{ backgroundColor: color, width: '10px', height: '10px' }} />
      )}
    >
      <div style={{ width: '100%', height: '100%' }}>Move your cursor here!</div>
    </Cursors>
  );
}
```

## API Reference

For detailed API documentation, visit the [InstantDB documentation](https://instantdb.com/docs).

## License

ISC