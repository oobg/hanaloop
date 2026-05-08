import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { cn } from "@/shared/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PCF 대시보드",
  description: "제품 탄소 발자국(PCF) 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("dark h-full", geistSans.variable, geistMono.variable)}
    >
      <body className="min-h-full">
        <Script id="color-scheme-init" strategy="beforeInteractive">
          {`(function(){
  try {
    var d = document.documentElement;
    var light = window.matchMedia("(prefers-color-scheme: light)").matches;
    if (light) d.classList.remove("dark");
    else d.classList.add("dark");
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function (e) {
      if (e.matches) d.classList.remove("dark");
      else d.classList.add("dark");
    });
  } catch (e) {}
})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
