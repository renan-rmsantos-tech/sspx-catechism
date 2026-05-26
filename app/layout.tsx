import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#B45309",
};

export const metadata: Metadata = {
  title: "Catequese",
  description: "Sistema de gestão de presença para catecismo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Catequese",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SerwistProvider swUrl="/serwist/sw.js">
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
