// Icônes au trait (24×24), même épaisseur partout.
type Props = { className?: string };

function Trait({ className, children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconeWhatsapp({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.29Z" />
    </svg>
  );
}

export function IconeCamion({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </Trait>
  );
}

export function IconeBillet({ className }: Props) {
  return (
    <Trait className={className}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" />
    </Trait>
  );
}

export function IconeEclair({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z" />
    </Trait>
  );
}

export function IconeFleche({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Trait>
  );
}

export function IconeRetour({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Trait>
  );
}

export function IconeAppareilPhoto({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z" />
      <circle cx="12" cy="13.2" r="3.4" />
    </Trait>
  );
}

export function IconeMoins({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M5 12h14" />
    </Trait>
  );
}

export function IconePlus({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M12 5v14M5 12h14" />
    </Trait>
  );
}

export function IconeCroix({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Trait>
  );
}

export function IconeGlisser({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M8 9 5 12l3 3M16 9l3 3-3 3M5 12h14" />
    </Trait>
  );
}

export function IconeChaussure({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M3 16.5v-6.8l3.2-.7 2.3 2.6 2.2-1.3 1.5 1.6 4.1.9c2.6.6 4.7 1.9 4.7 3.7H3Z" />
      <path d="M3 16.5h18v1.6H3z" />
    </Trait>
  );
}

export function IconeListe({ className }: Props) {
  return (
    <Trait className={className}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
    </Trait>
  );
}

export function IconeTelephone({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
    </Trait>
  );
}

export function IconeReglages({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </Trait>
  );
}

export function IconeCrayon({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
    </Trait>
  );
}

export function IconePoubelle({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" />
    </Trait>
  );
}

export function IconeCoche({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Trait>
  );
}

export function IconePartager({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M12 3.5v12M7.5 8 12 3.5 16.5 8M5 13v6.5h14V13" />
    </Trait>
  );
}

export function IconeDeconnexion({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M14 4.5h5v15h-5M10 8l-4 4 4 4M6 12h10" />
    </Trait>
  );
}

export function IconeOeil({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Trait>
  );
}

export function IconeHaut({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="m6 14 6-6 6 6" />
    </Trait>
  );
}

export function IconeBas({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="m6 10 6 6 6-6" />
    </Trait>
  );
}

export function IconePoignee({ className }: Props) {
  return (
    <Trait className={className}>
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={3} />
    </Trait>
  );
}
