import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatVault | Private AI Search for WhatsApp",
  description:
    "A privacy-first semantic search engine for WhatsApp exports. Runs 100% in-browser using Rust, WebAssembly, and BERT. Zero data egress.",
  keywords: [
    "WhatsApp",
    "Search",
    "AI",
    "Rust",
    "WebAssembly",
    "Privacy",
    "Local-First",
  ],
  authors: [
    { name: "Marcos Hernanz", url: "https://github.com/marcoshernanz" },
  ],
  openGraph: {
    title: "ChatVault | Private AI Search for WhatsApp",
    description:
      "Search your chat history with meaning, not just keywords. Powered by Rust & Wasm.",
    type: "website",
    images: ["/demo/demo_image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChatVault | Private AI Search for WhatsApp",
    description:
      "Search your chat history with meaning, not just keywords. Powered by Rust & Wasm.",
    creator: "@marcoshernanz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
