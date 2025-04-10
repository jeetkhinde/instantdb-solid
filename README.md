# @jeetkhinde/instantdb-solid

SolidJS integration for [InstantDB](https://instantdb.com/), providing reactive primitives for real-time database interactions. This SolidJS wrapper is similar to the `@instantdb/react` package.

## Installation

```bash
npm install @jeetkhinde/instantdb-solid @instantdb/core solid-js
```

## Quick Start

```jsx
import { createSignal } from 'solid-js';
import { init } from '@jeetkhinde/instantdb-solid';

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

## API Reference

For detailed API documentation, visit the [InstantDB documentation](https://instantdb.com/docs).

## License

ISC