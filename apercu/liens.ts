// Liens vers WhatsApp et les autres sites : toujours dans un nouvel onglet. Publié sur le web, l'aperçu
// s'affiche dans un cadre : ouvert dans ce cadre, WhatsApp remplacerait le site par une page vide.
document.addEventListener(
  "click",
  (evenement) => {
    const lien = evenement.target instanceof Element ? evenement.target.closest("a[href]") : null;
    if (lien instanceof HTMLAnchorElement && /^https?:\/\//.test(lien.getAttribute("href") ?? "")) {
      lien.target = "_blank";
      lien.rel = "noopener noreferrer";
    }
  },
  true,
);

export {};
