import { defineConfig } from 'vite';

export default defineConfig( {
  resolve: {
    extensions: [ '.js', '.ts', '.jsx', '.tsx' ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    transformMode: {
      web: [ /\.[jt]sx?$/ ],
    },
    // solid needs to be inline to work around
    // a resolution issue in vitest
    deps: {
      inline: [ /solid-js/ ],
    },
    // if you have few tests, try commenting one
    // or both out to improve performance:
    threads: false,
    isolate: false,
  }
} );