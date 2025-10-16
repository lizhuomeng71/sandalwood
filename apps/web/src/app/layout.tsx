import "./css/style.css";
import Footer from "@/components/ui/footer";
import Header from "@/components/ui/header";
import { Provider as AnalyticsProvider } from "@v1/analytics/client";
import { Inter } from 'next/font/google';
import type { Metadata } from "next";
import localFont from "next/font/local";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

const cabinet = localFont({
  src: [
    {
      path: '../../public/fonts/CabinetGrotesk-Medium.woff2',
      weight: '500',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Bold.woff2',
      weight: '700',
    },
    {
      path: '../../public/fonts/CabinetGrotesk-Extrabold.woff2',
      weight: '800',
    },
  ],
  variable: '--font-cabinet-grotesk',
  display: 'swap',
});

const DepartureMono = localFont({
  src: "../fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://v1.run"),
  title: "Create v1",
  description:
    "A free, open-source starter kit for your next project, built with insights from Midday.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cabinet.variable} ${DepartureMono.variable} font-inter antialiased bg-white text-gray-800 tracking-tight`}
      >
        <div className="flex flex-col min-h-screen overflow-hidden">
          <Header />
          {children}
          <Footer />
        </div>

        <AnalyticsProvider />
      </body>
    </html>
  );
}
