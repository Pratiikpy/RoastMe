import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "@/components/Toast";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/lib/ThemeContext";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: "Onchain Roast Me",
  description:
    "AI-powered roast generator on Base. Get roasted based on your social profile.",
  openGraph: {
    title: "Onchain Roast Me",
    description:
      "AI just roasted someone based on their social profile. Can you handle the heat?",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="base:app_id" content="69907d8c7ca07f5750bbd960" />
      </head>
      <body
        className={`${inter.className} ${spaceGrotesk.variable} antialiased min-h-screen text-[var(--text-primary)]`}
        style={{ background: "var(--body-gradient, var(--background))" }}
      >
        <ThemeProvider>
          <Providers>
            <ToastProvider>
              <ErrorBoundary>{children}</ErrorBoundary>
            </ToastProvider>
          </Providers>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
