import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "Asia Hiking Trails - 아시아 하이킹 코스 추천",
  description:
    "아시아 최고의 하이킹 코스를 발견하세요. 초급부터 중급까지 다양한 난이도의 트레일 정보와 커뮤니티를 제공합니다.",
  keywords: ["하이킹", "등산", "아시아", "트레일", "여행", "hiking", "asia", "trails"],
  authors: [{ name: "Asia Hiking Trails" }],
  creator: "v0.app",
  publisher: "Asia Hiking Trails",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
}
