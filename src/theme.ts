// Palette: light paper background, near-black ink (the logo colour), one red
// for everything that is "raté" and a yellow marker for what Vybz Studios
// brings. WhatsApp green is only used on the call-to-action.
export const C = {
  paper: "#F3F1EC",
  card: "#FFFFFF",
  ink: "#0B0B0B",
  mute: "#5E5B55",
  line: "#DAD6CD",
  red: "#E5251B",
  yellow: "#FFD60A",
  green: "#25D366",
  // White reads at 4.3:1 to 6.4:1 on these greens (vs 1.9:1 on #25D366).
  greenDeep: "#128C4B",
  greenDark: "#0B6E36",
  night: "#14110F",
} as const;

export const FONT = "'Poppins', 'Noto Color Emoji', sans-serif";

export const W = 1080;
export const H = 1920;

// Headline zone at the top of the scenes that show a clip. It stays below the
// TikTok / Reels top bar.
export const TOP_TEXT = { top: 190, height: 360 } as const;
