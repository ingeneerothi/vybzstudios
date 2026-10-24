/** Adresse publique du site (liens absolus, sitemap). Sur Vercel, trouvée toute seule. */
function normaliser(url: string): string {
  const propre = url.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(propre) ? propre : `https://${propre}`;
}

const brute = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "";

export const URL_SITE = brute.trim() ? normaliser(brute) : "http://localhost:3000";
