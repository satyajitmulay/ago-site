import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Newsreader } from "next/font/google";
import { AppProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ago — when did you last…?",
  description:
    "Ago remembers the little recurring things — plants, backups, filters — and tells you at a glance what's fresh, due, or overdue. Saved only in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#f6f5f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
