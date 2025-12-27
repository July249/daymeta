import { build } from "esbuild";
import { execSync } from "child_process";
import { rmSync, readdirSync, statSync, unlinkSync, rmdirSync } from "fs";
import { join } from "path";

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

// Generate TypeScript declarations (temporary, will be bundled)
execSync("tsc --emitDeclarationOnly --project tsconfig.build.json", { stdio: "inherit" });

// Bundle declarations into a single file
execSync(
  "dts-bundle-generator -o dist/index.d.ts src/index.ts",
  { stdio: "inherit" }
);

// Clean up temporary declaration files (keep only index.d.ts and source maps for bundled files)
function cleanDeclarations(dir) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      try {
        const stats = statSync(filePath);
        if (stats.isDirectory()) {
          // Recursively clean subdirectories
          cleanDeclarations(filePath);
          // Remove empty directories
          try {
            if (readdirSync(filePath).length === 0) {
              rmdirSync(filePath);
            }
          } catch (e) {
            // Directory might have been removed already
          }
        } else if (file.endsWith(".d.ts") && file !== "index.d.ts") {
          // Remove all .d.ts files except index.d.ts
          unlinkSync(filePath);
          // Also try to remove .d.ts.map files
          try {
            unlinkSync(filePath + ".map");
          } catch (e) {
            // Map file might not exist, ignore
          }
        } else if (file.endsWith(".d.ts.map") && file !== "index.d.ts.map") {
          // Remove .d.ts.map files except for index.d.ts.map
          unlinkSync(filePath);
        }
      } catch (e) {
        // File might have been removed already, continue
        continue;
      }
    }
  } catch (e) {
    // Directory might not exist, ignore
  }
}

cleanDeclarations("dist");

console.log("Build completed successfully!");
