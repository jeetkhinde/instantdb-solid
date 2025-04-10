import {defineConfig} from 'tsup';

export default defineConfig( {
  entry: [ 'src/index.ts' ], // Adjust based on your entry file
  format: [ 'cjs', 'esm' ], // CommonJS and ES Module formats
  dts: true, // Generate TypeScript declaration files
  external: [ 'fsevents' ], // Exclude native modules
  clean: true, // Clean output directory before building
} );