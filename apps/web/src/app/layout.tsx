import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Providers = dynamic(
  () => import("@/components/providers").then((module) => module.Providers),
  {
    ssr: false,
  },
);

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
