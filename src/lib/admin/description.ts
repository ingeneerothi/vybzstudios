// Générateur de description gratuit et instantané (sans IA, sans abonnement) :
// des phrases modèles remplies avec le nom, la marque et la couleur. Le vendeur peut toujours retoucher.

type Infos = { nom: string; marque: string; couleur: string };

type Famille = "running" | "basket" | "luxe" | "skate" | "sneaker";

const FAMILLES: Array<[RegExp, Famille]> = [
  [/gel|kayano|nyc|vomero|p-?6000|shox|air max|pegasus|2002r|530|990|runner|zoom/i, "running"],
  [/jordan|dunk|air force|af1|blazer|forum|superstar/i, "basket"],
  [/dior|gucci|balenciaga|prada|louis|vuitton|b\d{2}|mcqueen/i, "luxe"],
  [/vans|old skool|style 36|sk8|converse|chuck/i, "skate"],
];

const ACCROCHES: Record<Famille, string[]> = {
  running: [
    "Une silhouette running rétro, devenue un incontournable du style urbain.",
    "L'esprit running des années 2000, revisité pour la ville.",
  ],
  basket: [
    "Un classique du basket devenu une icône de la rue.",
    "Une valeur sûre, aussi à l'aise en semaine que le week-end.",
  ],
  luxe: [
    "Une pièce à l'allure haut de gamme, pour une tenue qui se remarque.",
    "Des lignes modernes et une finition soignée, pour un style affirmé.",
  ],
  skate: ["L'esprit skate dans une version qui sort du lot.", "Une base classique, un détail qui change tout."],
  sneaker: [
    "Un look net et moderne, qui s'accorde avec toutes vos tenues.",
    "Une paire facile à porter, qui fait toute la différence.",
  ],
};

const FINS = [
  "Facile à associer avec un jean comme avec un jogging.",
  "Elle complète aussi bien une tenue simple qu'un look travaillé.",
  "Une paire qu'on a envie de porter tous les jours.",
];

function famille({ nom, marque }: Infos): Famille {
  const texte = `${marque} ${nom}`;
  return FAMILLES.find(([motif]) => motif.test(texte))?.[1] ?? "sneaker";
}

export function genererDescription(infos: Infos, variante = 0): string {
  const nom = infos.nom.trim();
  const marque = infos.marque.trim();
  const couleur = infos.couleur.trim().toLowerCase();
  const nomComplet = marque && !nom.toLowerCase().startsWith(marque.toLowerCase()) ? `${nom} de ${marque}` : nom;
  const ouverture = couleur ? `La ${nomComplet} en ${couleur}.` : `La ${nomComplet}.`;
  const accroches = ACCROCHES[famille(infos)];
  const accroche = accroches[variante % accroches.length];
  const fin = FINS[Math.floor(variante / accroches.length) % FINS.length];
  return `${ouverture} ${accroche} ${fin}`;
}
