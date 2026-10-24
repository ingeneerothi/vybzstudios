import type { Metadata, Viewport } from "next";
import { FournisseurAdmin } from "@/components/admin/Fournisseur";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin Vertical Store" },
  manifest: "/admin.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "VS Admin", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#3e5a1f",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <FournisseurAdmin>
      <div className="min-h-dvh bg-papier text-[17px]">{children}</div>
    </FournisseurAdmin>
  );
}
