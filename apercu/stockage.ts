// L'aperçu garde tout en mémoire : rien n'est écrit sur l'appareil, et chaque ouverture repart
// du même état (les fichiers ouverts depuis le téléphone n'ont pas toujours accès au stockage).
class Memoire implements Storage {
  private valeurs = new Map<string, string>();
  get length() {
    return this.valeurs.size;
  }
  clear() {
    this.valeurs.clear();
  }
  getItem(cle: string) {
    return this.valeurs.get(cle) ?? null;
  }
  key(i: number) {
    return [...this.valeurs.keys()][i] ?? null;
  }
  removeItem(cle: string) {
    this.valeurs.delete(cle);
  }
  setItem(cle: string, valeur: string) {
    this.valeurs.set(cle, String(valeur));
  }
}

Object.defineProperty(window, "localStorage", { configurable: true, value: new Memoire() });
