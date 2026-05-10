import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

export const metadata: Metadata = {
  title: "AlmostRight — Spec Quality Analyzer",
  description: "Paste your product spec and catch contradictions, ambiguities, scope landmines, and missing edge cases before they hit a sprint.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
