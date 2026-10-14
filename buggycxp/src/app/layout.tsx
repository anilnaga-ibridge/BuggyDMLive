import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuggyCXP - Enterprise Experience Cloud",
  description: "Server-Driven Experience Orchestration Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#070a13] antialiased" suppressHydrationWarning>
      <body className="h-full text-slate-100 font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
