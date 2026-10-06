import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TDV Minifutbol Liqası — Pley-off Braketi & Canlı Turnir Portalı",
  description:
    "TDV BTL Məktəb Minifutbol Çempionatının rəsmi analitika, turnir cədvəli və bombardirlər lövhəsi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className="dark">
      <body className="min-h-screen bg-[#040d07] text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
