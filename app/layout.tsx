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

export const metadata: Metadata = {
  title: {
    default: "WeBroker — Rental agreements, sorted in minutes",
    template: "%s · WeBroker",
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
