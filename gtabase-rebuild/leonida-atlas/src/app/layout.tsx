import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AccountsDialogProvider, ShellProvider, SideColumn } from "@/components/ui";
import { SkipLinks } from "@/components/shell/SkipLinks";
import { SiteHeader } from "@/components/shell/SiteHeader";
import { GameSubnav } from "@/components/shell/GameSubnav";
import { LazyFooter } from "@/components/shell/LazyFooter";
import { BackToTop } from "@/components/shell/BackToTop";
import "./globals.css";
import "./shell.css";
import "./content.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "GTA 6 Field Guide | Leonida Atlas",
  description: "Leonida Atlas — a fan-made field guide to GTA 6, built on invented sample data.",
  applicationName: "Leonida Atlas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14161B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body data-testid="body">
        <ShellProvider>
          <AccountsDialogProvider>
            <SkipLinks />
            <SiteHeader />
            <GameSubnav />
            <main id="content" className="atlas-main" tabIndex={-1}>
              <div className="atlas-content">{children}</div>
              <SideColumn />
            </main>
            <LazyFooter />
            <BackToTop />
          </AccountsDialogProvider>
        </ShellProvider>
      </body>
    </html>
  );
}
