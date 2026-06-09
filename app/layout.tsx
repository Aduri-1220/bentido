import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "@/lib/env"; // Validate environment at startup
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const siteUrl = process.env.NEXTAUTH_URL ?? "https://bentido.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "bentido — Rental agreements, sorted in minutes",
    template: "%s · bentido",
  },
  description:
    "Neutral mediation for landlords and tenants: verified KYC, structured rental drafts, e-stamp and e-sign — without the usual broker runaround.",
  keywords: [
    "rental agreement",
    "lease agreement",
    "aadhaar e-sign",
    "e-stamp",
    "notary",
    "India",
  ],
  applicationName: "bentido",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "bentido",
    title: "bentido — Rental agreements, sorted in minutes",
    description:
      "Verified KYC, structured rental drafts, e-stamp and e-sign — without the broker runaround.",
  },
  twitter: {
    card: "summary_large_image",
    title: "bentido — Rental agreements, sorted in minutes",
    description:
      "Verified KYC, structured rental drafts, e-stamp and e-sign — without the broker runaround.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
