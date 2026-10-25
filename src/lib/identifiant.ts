/** Identifiant unique, même là où `crypto.randomUUID` manque (page ouverte hors https, lecteur de téléphone). */
export function identifiant(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
