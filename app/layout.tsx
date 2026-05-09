import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AlmostRight — Spec Contradiction Analyzer",
  description: "Paste your product spec and catch AI-generated contradictions before they ship.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
