import "./globals.css";
import type { Viewport } from "next";
import { Providers } from "./providers";
import Nav from "src/app/components/nav";

export const metadata = {
  title: "Gym Risk",
  description: "Track training load and detect injury risk",
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="app-shell">
        <Providers>
          <Nav />
          <main className="page">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
