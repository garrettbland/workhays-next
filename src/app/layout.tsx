import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Work Hays — Local jobs in Hays, Kansas", template: "%s · Work Hays" },
  description: "Find local jobs in Hays and western Kansas. Employers post for free.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
