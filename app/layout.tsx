import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quanda-dms4-demo-jet.vercel.app"),
  title: "QUANDA — From brief to learning path",
  description: "Turn a creative project brief into a practical learning and production plan.",
  openGraph: {
    title: "QUANDA — From brief to learning path",
    description: "Turn a creative project brief into a practical learning and production plan.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "QUANDA — From brief to a learning path" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QUANDA — From brief to learning path",
    description: "Turn a creative project brief into a practical learning and production plan.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
