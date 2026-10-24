import type { NextConfig } from "next";

const supabaseHote = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

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
