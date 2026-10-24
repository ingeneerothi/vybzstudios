import type { NextConfig } from "next";
import { MODE_DEMO, SUPABASE_CLE, SUPABASE_URL } from "./src/lib/env";

function hote(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

const supabaseHote = hote(SUPABASE_URL);

// Visible dans les journaux de construction (Vercel > Deployments > Build Logs).
if (Boolean(SUPABASE_URL) !== Boolean(SUPABASE_CLE)) {
  console.warn("⚠️  Supabase incomplet : il manque l'URL ou la clé. Le site est construit en MODE DÉMO.");
} else if (!MODE_DEMO && !supabaseHote) {
  console.warn(`⚠️  NEXT_PUBLIC_SUPABASE_URL ne ressemble pas à une adresse : « ${SUPABASE_URL} ».`);
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80],
    remotePatterns: supabaseHote
      ? [{ protocol: "https", hostname: supabaseHote, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;
