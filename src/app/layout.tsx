import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Mouvement } from "@/components/site/Mouvement";
import { URL_SITE } from "@/lib/site";
import "./globals.css";

const archivo = localFont({
  src: "./fonts/archivo-variable.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: "Vertical Store — Sneakers à Abidjan",
    template: "%s · Vertical Store",
  },
  description:
    "Sneakers livrées à Abidjan et partout en Côte d'Ivoire. Commande en 1 minute sur WhatsApp.",
  applicationName: "Vertical Store",
  openGraph: {
    type: "website",
    locale: "fr_CI",
    siteName: "Vertical Store",
    images: [{ url: "/icones/icone-512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#f6f5f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${archivo.variable} antialiased`}>
      <body className="min-h-dvh">
        <Mouvement>{children}</Mouvement>
      </body>
    </html>
  );
}
