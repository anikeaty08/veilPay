import type { Metadata } from "next";
import { ClientProviders } from "@/components/client-providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeilPay",
  description:
    "Confidential payouts, payroll, and treasury operations on EVM using FHE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
