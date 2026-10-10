// Palette v2: a cool, light studio background with one vivid violet accent
// for what Vybz Studios brings. The other colours each have a single job:
// red only for what is "raté", orange only for the price, WhatsApp green only
// for the contact button.
export const C = {
  bgCenter: "#F7F8FB",
  bgEdge: "#D6DAE5",
  paper: "#EEF0F5",
  card: "#FFFFFF",
  ink: "#111216",
  mute: "#5C6070",
  line: "#E2E5EE",
  accent: "#5B3CF6",
  accentDeep: "#3F22D9",
  accentSoft: "#ECE8FF",
  orange: "#FF7A1A",
  red: "#FF3B30",
  green: "#25D366",
  night: "#14151A",
  // Kept for the "Nos réalisations" scene, unchanged on purpose.
  yellow: "#FFD60A",
  greenDeep: "#128C4B",
  greenDark: "#0B6E36",
} as const;

export const FONT = "'Poppins', 'Noto Color Emoji', sans-serif";

export const W = 1080;
export const H = 1920;

// Soft shadow shared by every card, phone and caption.
export const SHADOW =
  "0 34px 70px rgba(17,18,22,0.16), 0 10px 24px rgba(17,18,22,0.10)";

// Headline zone at the top of the scenes that show a clip. It stays below the
// TikTok / Reels top bar.
export const TOP_TEXT = { top: 190, height: 360 } as const;
