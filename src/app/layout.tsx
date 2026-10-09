import type { Metadata } from "next";
import { archivo, plexMono } from "./fonts";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Work Hays: Local jobs in Hays & western Kansas", template: "%s · Work Hays" },
  description: "Find local jobs in Hays and western Kansas. Employers post jobs and events for free.",
  openGraph: { siteName: SITE.name, type: "website", locale: "en_US" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
