import { defineConfig } from "father";

export default defineConfig({
  esm: { input: "src", transformer: "babel", output: "es" },
  cjs: { input: "src", transformer: "esbuild", output: "lib" },
  umd: {
    entry: "src/index.ts",
    output: "umd",
    name: "webgpu_compute",
    externals: {},
  },
  prebundle: {
    deps: {},
  },
});
