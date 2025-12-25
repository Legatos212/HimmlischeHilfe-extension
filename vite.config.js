import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function manifestPlugin(mode) {
  const manifestFile = mode === "live" ? "manifest.live.json" : "manifest.dev.json";

  return {
    name: "copy-manifest",
    generateBundle() {
      const manifestPath = path.resolve(__dirname, manifestFile);
      const source = fs.readFileSync(manifestPath, "utf-8");

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const buildMode = mode === "live" ? "live" : "dev";

  return {
    base: "",
    build: {
      outDir: path.resolve(__dirname, "dist", buildMode),
      emptyOutDir: true,
      sourcemap: buildMode === "dev",
      rollupOptions: {
        input: {
          content: path.resolve(__dirname, "src", "content", "content.js"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name].js",
          assetFileNames: "[name][extname]",
        },
      },
    },
    plugins: [manifestPlugin(buildMode)],
  };
});
