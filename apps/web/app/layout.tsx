import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ProfileCore",
  description: "Turn LinkedIn PDFs into structured profiles and AI-native conversations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

