// Construction de l'aperçu (voir assembler.mjs) : les vrais composants du site, sans serveur.
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const ici = fileURLToPath(new URL(".", import.meta.url));
const racine = fileURLToPath(new URL("..", import.meta.url));

// Modules du site remplacés dans l'aperçu.
const remplacements: Record<string, string> = {
  [`${racine}src/components/commande/Validation.tsx`]: `${ici}Validation.tsx`,
  [`${racine}src/lib/admin/supabase.ts`]: `${ici}vide.ts`,
  [`${racine}src/lib/supabase/navigateur.ts`]: `${ici}vide.ts`,
  [`${racine}src/lib/admin/demo.ts`]: `${ici}demo-apercu.ts`,
};
// Les remplaçants peuvent toujours importer le module d'origine.
const remplacants = new Set(Object.values(remplacements));

function remplacer(): Plugin {
  return {
    name: "apercu-remplacements",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer || remplacants.has(importer)) return null;
      const resolu = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolu && remplacements[resolu.id] ? remplacements[resolu.id] : null;
    },
  };
}

const vide = JSON.stringify("");

export default defineConfig({
  root: ici,
  base: "./",
  publicDir: false,
  logLevel: "warn",
  plugins: [remplacer()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: `${ici}next/link.tsx` },
      { find: /^next\/image$/, replacement: `${ici}next/image.tsx` },
      { find: /^next\/navigation$/, replacement: `${ici}next/navigation.ts` },
      { find: /^@\//, replacement: `${racine}src/` },
    ],
  },
  // Pas de Supabase dans l'aperçu : le site tourne en mode démo.
  define: {
    "process.env.NEXT_PUBLIC_SUPABASE_URL": vide,
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": vide,
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": vide,
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY": vide,
    "process.env.NEXT_PUBLIC_SITE_URL": vide,
    "process.env.VERCEL_PROJECT_PRODUCTION_URL": vide,
  },
  oxc: { jsx: { runtime: "automatic" } },
  build: {
    outDir: `${ici}cache/dist`,
    emptyOutDir: true,
    target: "es2022",
    modulePreload: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 10_000, // un seul fichier, voulu
    rolldownOptions: {
      output: { codeSplitting: false },
      // « use client » n'a pas de sens hors de Next : avertissement sans objet ici.
      onLog(niveau, log, suite) {
        if (log.code !== "MODULE_LEVEL_DIRECTIVE") suite(niveau, log);
      },
    },
  },
});
