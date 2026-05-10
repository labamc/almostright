"use client"

import { useState } from "react"
import Link from "next/link"
import { SpecForm } from "@/components/SpecForm"
import { ResultsDisplay } from "@/components/ResultsDisplay"
import { ThemeToggle } from "@/components/ThemeToggle"
import type { AnalysisResult } from "@/lib/types"

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
              AlmostRight
            </span>
            <ThemeToggle />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
            Find what&apos;s wrong with your spec before engineering does
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Paste your product spec and we&apos;ll surface contradictions, ambiguities, scope landmines,
            missing edge cases, and untestable requirements — before they hit a sprint.
          </p>
        </header>

        <SpecForm
          onResult={(r) => { setResult(r); setError(null) }}
          onError={(e) => { setError(e); setResult(null) }}
        />

        {error && (
          <div className="mt-6 px-4 py-3 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            {error}
          </div>
        )}

        {result && <ResultsDisplay result={result} />}

        <footer className="mt-16 pt-8 border-t border-border">
          <Link
            href="/stats"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Usage stats →
          </Link>
        </footer>
      </div>
    </main>
  )
}
