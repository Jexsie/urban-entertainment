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
          <span className="brand">URBAN ENTERTAINMENT</span>
        </header>
        {children}
      </body>
    </html>
  );
}
