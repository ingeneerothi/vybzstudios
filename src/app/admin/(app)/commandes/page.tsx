"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { EnTeteAdmin } from "@/components/admin/EnTeteAdmin";
import { useAdmin } from "@/components/admin/Fournisseur";
import { usePhotoWhatsapp } from "@/components/commande/usePhotoWhatsapp";
import { IconePartager, IconeTelephone, IconeWhatsapp } from "@/components/site/Icones";
import { LIBELLES_STATUT } from "@/lib/admin/api";
import { cn } from "@/lib/cn";
import { formatDate, formatPrix } from "@/lib/format";
import { partagerPhoto, peutPartager } from "@/lib/partager";
import { formaterTelephone, numeroInternationalClient } from "@/lib/telephone";
import type { Commande, Demande, Statut } from "@/lib/types";
import { lienPartage, lienWhatsapp, messageCommande } from "@/lib/whatsapp";

const STATUTS: Statut[] = ["nouvelle", "envoyee", "livree", "annulee"];
const COULEURS: Record<Statut, string> = {
  nouvelle: "bg-promo text-white",
  envoyee: "bg-encre text-white",
  livree: "bg-vert text-white",
  annulee: "bg-trait text-encre-doux",
};

export default function Commandes() {
  const { api, executer } = useAdmin();
  const [onglet, setOnglet] = useState<"commandes" | "demandes">("commandes");
  const [commandes, setCommandes] = useState<Commande[] | null>(null);
  const [demandes, setDemandes] = useState<Demande[] | null>(null);

  const charger = useCallback(async () => {
    if (!api) return;
    await executer(async () => {
      const [c, d] = await Promise.all([api.commandes(), api.demandes()]);
      setCommandes(c);
      setDemandes(d);
    });
  }, [api, executer]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function statutCommande(c: Commande, statut: Statut) {
    if (!api) return;
    const ok = await executer(
      () => api.statutCommande(c.id, statut).then(() => true),
      `${c.code} : ${LIBELLES_STATUT[statut]} ✅`,
    );
    if (ok) setCommandes((liste) => liste?.map((x) => (x.id === c.id ? { ...x, statut } : x)) ?? null);
  }

  async function statutDemande(d: Demande, statut: Statut) {
    if (!api) return;
    const ok = await executer(
      () => api.statutDemande(d.id, statut).then(() => true),
      `${d.code} : ${LIBELLES_STATUT[statut]} ✅`,
    );
    if (ok) setDemandes((liste) => liste?.map((x) => (x.id === d.id ? { ...x, statut } : x)) ?? null);
  }

  const nouvellesCommandes = commandes?.filter((c) => c.statut === "nouvelle").length ?? 0;
  const nouvellesDemandes = demandes?.filter((d) => d.statut === "nouvelle").length ?? 0;

  return (
    <>
      <EnTeteAdmin
        titre="Commandes"
        action={
          <button
            type="button"
            onClick={charger}
            className="min-h-12 rounded-full px-4 text-[16px] font-medium text-vert"
          >
            Actualiser
          </button>
        }
      />
      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-carte p-1" role="tablist" aria-label="Type">
          {(
            [
              ["commandes", "Commandes", nouvellesCommandes],
              ["demandes", "Demandes", nouvellesDemandes],
            ] as const
          ).map(([valeur, libelle, n]) => (
            <button
              key={valeur}
              type="button"
              role="tab"
              aria-selected={onglet === valeur}
              onClick={() => setOnglet(valeur)}
              className={cn(
                "flex min-h-12 items-center justify-center gap-2 rounded-xl text-[16px] font-semibold transition-colors",
                onglet === valeur ? "bg-white shadow-sm" : "text-gris",
              )}
            >
              {libelle}
              {n > 0 && <span className="rounded-full bg-promo px-2 py-0.5 text-[13px] text-white">{n}</span>}
            </button>
          ))}
        </div>

        {onglet === "commandes" ? (
          <ul className="mt-4 space-y-4">
            {commandes == null && <li className="h-48 rounded-[22px] bg-carte" aria-busy="true" />}
            {commandes?.length === 0 && <Vide texte="Aucune commande pour le moment." />}
            {commandes?.map((c) => (
              <CarteCommande key={c.id} commande={c} onStatut={(s) => statutCommande(c, s)} />
            ))}
          </ul>
        ) : (
          <ul className="mt-4 space-y-4">
            {demandes == null && <li className="h-48 rounded-[22px] bg-carte" aria-busy="true" />}
            {demandes?.length === 0 && <Vide texte="Aucune demande pour le moment." />}
            {demandes?.map((d) => (
              <CarteDemande key={d.id} demande={d} onStatut={(s) => statutDemande(d, s)} />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Vide({ texte }: { texte: string }) {
  return (
    <li className="rounded-[22px] bg-white p-8 text-center text-[16px] text-gris ring-1 ring-trait/70">{texte}</li>
  );
}

function Statuts({ actuel, onChange }: { actuel: Statut; onChange: (s: Statut) => void }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Statut">
      {STATUTS.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={actuel === s}
          onClick={() => actuel !== s && onChange(s)}
          className={cn(
            "min-h-12 rounded-2xl px-2 text-[15px] font-semibold transition-colors",
            actuel === s ? COULEURS[s] : "bg-papier text-gris ring-1 ring-trait",
          )}
        >
          {LIBELLES_STATUT[s]}
        </button>
      ))}
    </div>
  );
}

function Contact({ telephone, nom }: { telephone: string; nom: string }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <a href={`tel:+${numeroInternationalClient(telephone)}`} className="bouton-contour min-h-12 px-3 text-[15px]">
        <IconeTelephone className="size-5" />
        Appeler
      </a>
      <a
        href={lienWhatsapp(numeroInternationalClient(telephone), `Bonjour ${nom}, c'est Vertical Store.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="bouton-contour min-h-12 px-3 text-[15px]"
      >
        <IconeWhatsapp className="size-5" />
        WhatsApp
      </a>
    </div>
  );
}

function CarteCommande({ commande: c, onStatut }: { commande: Commande; onStatut: (s: Statut) => void }) {
  const lieu = c.ville ? `${c.ville} (expédition)` : [c.commune ?? c.zone, c.quartier].filter(Boolean).join(", ");
  const message = messageCommande({
    code: c.code,
    chaussure: c.chaussureNom,
    pointure: c.pointure,
    quantite: c.quantite,
    prixUnitaire: c.prixUnitaire,
    zone: c.zone,
    fraisLivraison: c.fraisLivraison,
    total: c.total,
    modePaiement: c.modePaiement,
    whatsapp: "",
    nom: c.clientNom,
    telephone: c.clientTelephone,
    lieu,
    adresse: c.adresse,
    repere: c.repere ?? "",
  });

  return (
    <li className="rounded-[22px] bg-white p-4 ring-1 ring-trait/70">
      <div className="flex items-start gap-3">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-carte">
          {c.chaussureImage && <Image src={c.chaussureImage} alt="" fill sizes="64px" className="object-contain" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="text-[17px] font-bold tabular-nums">{c.code}</span>
            <span className="text-[14px] text-gris">{formatDate(c.creeLe)}</span>
          </p>
          <p className="mt-0.5 text-[16px] font-medium">{c.chaussureNom}</p>
          <p className="text-[15px] text-gris">
            Pointure {c.pointure} · Quantité {c.quantite}
          </p>
        </div>
      </div>
      <dl className="mt-3 space-y-1 text-[16px]">
        <div className="flex justify-between gap-3">
          <dt className="text-gris">Total</dt>
          <dd className="font-bold tabular-nums">{formatPrix(c.total)}</dd>
        </div>
        <div>
          <dt className="sr-only">Client</dt>
          <dd>
            <strong>{c.clientNom}</strong> · {formaterTelephone(c.clientTelephone)}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Livraison</dt>
          <dd>
            {c.zone} — {lieu}
            <br />
            {c.adresse}
            {c.repere && <span className="text-gris"> · Repère : {c.repere}</span>}
          </dd>
        </div>
      </dl>
      <Contact telephone={c.clientTelephone} nom={c.clientNom} />
      <EnvoyerAuLivreur message={message} image={c.chaussureImage} nomFichier={`${c.code}.jpg`} />
      <Statuts actuel={c.statut} onChange={onStatut} />
    </li>
  );
}

function CarteDemande({ demande: d, onStatut }: { demande: Demande; onStatut: (s: Statut) => void }) {
  return (
    <li className="rounded-[22px] bg-white p-4 ring-1 ring-trait/70">
      <p className="flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="text-[17px] font-bold tabular-nums">{d.code}</span>
        <span className="text-[14px] text-gris">{formatDate(d.creeLe)}</span>
      </p>
      {d.photo && (
        <a
          href={d.photo}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block overflow-hidden rounded-2xl bg-carte"
        >
          {/* Photo envoyée par le client (Supabase ou démo) : affichage simple */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.photo} alt="Chaussure demandée" className="max-h-72 w-full object-contain" loading="lazy" />
        </a>
      )}
      <dl className="mt-3 space-y-1 text-[16px]">
        <div>
          <dt className="inline text-gris">Pointure : </dt>
          <dd className="inline font-medium">{d.pointure ?? "non précisée"}</dd>
        </div>
        <div>
          <dt className="sr-only">Client</dt>
          <dd>
            <strong>{d.clientNom}</strong> · {formaterTelephone(d.clientTelephone)}
          </dd>
        </div>
        <div>
          <dt className="inline text-gris">Lieu : </dt>
          <dd className="inline">{d.lieu}</dd>
        </div>
        {d.commentaire && (
          <div>
            <dt className="inline text-gris">Commentaire : </dt>
            <dd className="inline">{d.commentaire}</dd>
          </div>
        )}
      </dl>
      <Contact telephone={d.clientTelephone} nom={d.clientNom} />
      <Statuts actuel={d.statut} onChange={onStatut} />
    </li>
  );
}

/**
 * Envoie la commande au livreur. Sur téléphone : par le menu « Partager », la photo de la chaussure part comme
 * une vraie photo, avec toute la commande en légende ; on choisit le livreur dans WhatsApp.
 * Ailleurs (ordinateur) : la commande seule, en texte.
 */
function EnvoyerAuLivreur({
  message,
  image,
  nomFichier,
}: {
  message: string;
  image: string | null;
  nomFichier: string;
}) {
  const fichier = usePhotoWhatsapp(image, nomFichier);
  const avecPhoto = peutPartager(fichier);

  async function envoyer() {
    if (avecPhoto && (await partagerPhoto(fichier, message).catch(() => null)) !== null) return;
    window.open(lienPartage(message), "_blank", "noopener,noreferrer");
  }

  return (
    <button type="button" onClick={envoyer} className="bouton-plein mt-2 min-h-12 w-full text-[15px]">
      <IconePartager className="size-5" />
      {avecPhoto ? "Envoyer au livreur, avec la photo" : "Envoyer au livreur"}
    </button>
  );
}
