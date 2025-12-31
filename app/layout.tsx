import "./globals.css";
import { Providers } from "./providers";
import Nav from "@/components/nav";

export const metadata = {
  title: "Gym Risk App",
  description: "Track training load and detect injury risk"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
	<Nav />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
