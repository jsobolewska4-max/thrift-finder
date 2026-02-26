import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thrift Finder — Find second-hand fashion for less",
  description:
    "Search across Poshmark, Depop, The RealReal, and ThredUp to find the best price on second-hand fashion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
