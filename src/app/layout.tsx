import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Surhay Design Admin",
  description: "Admin dashboard for Surhay Design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
