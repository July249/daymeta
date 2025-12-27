import { build } from "esbuild";
import { execSync } from "child_process";
import { rmSync } from "fs";

// Clean dist folder
rmSync("dist", { recursive: true, force: true });

// Build ESM
await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  sourcemap: true,
  external: [],
});

// Build CJS
await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.cjs",
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: true,
  external: [],
});

// Generate TypeScript declarations
execSync("tsc --emitDeclarationOnly --outDir dist", { stdio: "inherit" });

console.log("Build completed successfully!");
