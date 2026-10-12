import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "破局 · 企业运营训练场",
  description: "25 家公司经营对抗、团队训练与进度复盘。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
