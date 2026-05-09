import "./globals.css";

import type { Metadata } from "next";
import Script from "next/script";

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
    <html lang="ko" suppressHydrationWarning className="dark h-full">
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
