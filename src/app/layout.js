import { ClerkProvider } from "@clerk/nextjs";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
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
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
        <body className="min-h-full flex flex-col font-sans bg-[#F7F6F5] text-[#201C17]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
