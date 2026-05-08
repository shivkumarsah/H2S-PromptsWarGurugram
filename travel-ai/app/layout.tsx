import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TravelAI — AI-Powered Travel Planning",
  description: "Plan perfect trips with AI. Personalized itineraries, real-time adaptation, and intelligent recommendations powered by Google Gemini.",
  keywords: "travel planning, AI itinerary, trip planner, Google Gemini, personalized travel",
  authors: [{ name: "TravelAI" }],
  robots: "index, follow",
  openGraph: {
    title: "TravelAI — AI-Powered Travel Planning",
    description: "Your intelligent travel companion. Generate perfect itineraries instantly.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelAI — AI-Powered Travel Planning",
    description: "Plan perfect trips with AI. Powered by Google Gemini.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Favicon */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✈️</text></svg>" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:font-medium focus:no-underline"
          aria-label="Skip to main content"
        >
          Skip to main content
        </a>

        <div id="main-content" role="main" aria-label="TravelAI Application">
          {children}
        </div>

        {/* Live region for dynamic announcements */}
        <div
          id="live-region"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          role="status"
        />

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
            },
            ariaProps: {
              role: 'status',
              'aria-live': 'polite',
            },
          }}
        />
      </body>
    </html>
  );
}
