import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Contribution Cards";
const description =
  "Turn a GitHub contribution graph into a clean, croppable image for social media.";

export const metadata: Metadata = {
  metadataBase: new URL("https://contribution-cards.vercel.app"),
  title,
  description,
  applicationName: title,
  authors: [{ name: "James Frewin", url: "https://github.com/heyimjames" }],
  openGraph: {
    type: "website",
    siteName: title,
    title,
    description,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1b1e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
