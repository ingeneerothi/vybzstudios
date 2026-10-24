/** « Air Max 95 x Corteiz » + « Nike » -> « nike-air-max-95-x-corteiz » (unique parmi les slugs existants). */
export function creerSlug(marque: string, nom: string, existants: Iterable<string> = []): string {
  const base =
    `${marque} ${nom}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "chaussure";
  const pris = new Set(existants);
  if (!pris.has(base)) return base;
  let n = 2;
  while (pris.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
