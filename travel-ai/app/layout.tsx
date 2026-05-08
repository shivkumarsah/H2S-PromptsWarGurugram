import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TravelAI — AI-Powered Travel Planning",
  description: "Plan perfect trips with AI. Personalized itineraries, real-time adaptation, and intelligent recommendations powered by Google Gemini.",
  keywords: "travel planning, AI itinerary, trip planner, Google Gemini, personalized travel",
  openGraph: {
    title: "TravelAI — AI-Powered Travel Planning",
    description: "Your intelligent travel companion. Generate perfect itineraries instantly.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
