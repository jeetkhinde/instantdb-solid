import {defineConfig} from 'tsup';
import {nodeExternalsPlugin} from 'esbuild-node-externals';

export default defineConfig( {
  entry: [ 'src/index.ts' ],
  format: [ 'cjs', 'esm' ],
  dts: true,
  splitting: false,
  sourcemap: true,
  noExternal: [ 'fsevents' ],
  clean: true,
  esbuildPlugins: [
    nodeExternalsPlugin(),
  ],
  esbuildOptions( options ) {
    options.loader = {
      ...options.loader,
      '.node': 'empty',
    };
    options.resolveExtensions = [ '.js', '.ts' ];
    options.conditions = [ 'node' ];
  },
} );