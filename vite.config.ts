import {defineConfig} from 'vite';
import path from 'path';

export default defineConfig( {
  resolve: {
    extensions: [ '.js', '.ts', '.jsx', '.tsx' ],
  },
  optimizeDeps: {exclude: [ 'fsevents' ]},
  build: {
    lib: {
      entry: path.resolve( __dirname, 'src/index.ts' ),
      name: '@jeetkhinde/instantdb-solid',
      fileName: ( format ) => `instantdb-solid.${format}.js`,
    },
    rollupOptions: {
      external: [ 'solid-js', '@instantdb/core' ],
      output: {
        globals: {
          'solid-js': 'SolidJS',
          '@instantdb/core': 'InstantDBCore',
        },
      },
    },
  },
} );

/// Vitest configuration
export const test = {
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
};