import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Fonts are loaded via the <link> tags in app/head.tsx (Google Fonts CDN)
// rather than next/font/google, so the build never depends on network
// access to fonts.googleapis.com at build time.

export const metadata: Metadata = {
  title: "BrokerFreeDU — flats and PGs near DU, no brokerage",
  description:
    "Students post the flat they're leaving, with the date it opens up. No brokers, no fees. Plus a petition for mandatory safety audits of buildings used as student housing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
