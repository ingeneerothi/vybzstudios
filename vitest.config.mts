import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Modules réservés au serveur : testés tels quels (le garde-fou ne vaut que pour le navigateur).
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/sql/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
  },
});
