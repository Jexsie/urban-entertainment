import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEON NIGHTS · Urban Entertainment",
  description: "Techno all-nighter in Cologne. Tickets for guests aged 18 or over.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <header className="site">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG */}
          <img src="/logo.svg" alt="" width={32} height={32} />
          <span className="brand">Urban Entertainment</span>
        </header>
        {children}
      </body>
    </html>
  );
}
