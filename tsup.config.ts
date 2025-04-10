// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"], // Your main entry point
  format: ["esm", "cjs"], // Output formats: ES Modules and CommonJS
  dts: true, // Generate declaration files (.d.ts)
  splitting: true, // Enable code splitting
  sourcemap: true, // Generate source maps
  clean: true, // Clean output directory before build
  external: ["solid-js", "@instantdb/core"],
  // If you were using JSX in your components (less likely for just primitives):
  // jsx: 'preserve',
  // esbuildOptions(options) {
  //   options.jsxImportSource = 'solid-js';
  // },
  outDir: "dist",
  target: "esnext",
  platform: "browser",
});
