// L'aperçu garde tout en mémoire : rien n'est écrit sur l'appareil, et chaque ouverture repart
// du même état. Le code du site écrit « localStorage » : la construction de l'aperçu le remplace
// par ce stockage (vite.config.mts), sans toucher au vrai stockage du navigateur.
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

declare global {
  var __stockageApercu: Storage;
  interface Window {
    /** Posé quand le site s'est affiché : les écrans fixes de secours peuvent disparaître. */
    __apercuPret?: boolean;
  }
}

globalThis.__stockageApercu = new Memoire();

export {};
