/* eslint-disable @next/next/no-page-custom-font */
import { ClerkProvider } from "@clerk/nextjs";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-local",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "WorkDashboard — Engineering Capacity & Operations Platform",
  description: "Enterprise-grade sprint capacity planning, real-time work logs, and blocker resolution engine.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Inter:ital,opsz,wght@0,14..32,400..800;1,14..32,400..800&family=Sora:wght@400;600;700;800&display=swap"
            rel="stylesheet"
          />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </head>
        <body className="min-h-full flex flex-col font-sans bg-[#F7F6F5] text-[#201C17]">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
