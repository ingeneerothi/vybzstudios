import { CadreSite } from "@/components/pages/CadreSite";
import { getCatalogue } from "@/lib/donnees/catalogue";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  return <CadreSite catalogue={await getCatalogue()}>{children}</CadreSite>;
}
