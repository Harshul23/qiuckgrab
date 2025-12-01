import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "QuickGrab - AI-Powered Student Marketplace",
  description: "Real-time, AI-powered, verified student marketplace for campus",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider defaultTheme="system" storageKey="quickgrab-theme">
          {children}
        </ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
