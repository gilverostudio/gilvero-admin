import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import { ThemedToaster } from "@/components/theme/themed-toaster";
import { THEME_SCRIPT } from "@/lib/theme";

import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Gilvero Studio Admin", template: "%s · Gilvero Admin" },
  description: "Content management for gilvero.com",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by THEME_SCRIPT before hydration, hence suppressHydrationWarning.
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${manrope.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">
        {children}
        <ThemedToaster />
      </body>
    </html>
  );
}
