"use client"

import { AlertTriangle, AlertCircle, Info, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult, Contradiction, Severity } from "@/lib/types"

interface ResultsDisplayProps {
  result: AnalysisResult
}

const severityConfig: Record<Severity, { label: string; icon: React.ElementType; className: string }> = {
  high: {
    label: "High",
    icon: AlertTriangle,
    className: "text-severity-high border-severity-high/20 bg-severity-high/5",
  },
  medium: {
    label: "Medium",
    icon: AlertCircle,
    className: "text-severity-medium border-severity-medium/20 bg-severity-medium/5",
  },
  low: {
    label: "Low",
    icon: Info,
    className: "text-severity-low border-severity-low/20 bg-severity-low/5",
  },
}

function CoherenceScore({ score }: { score: number }) {
  const label = score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Weak"
  const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"

  return (
    <div className="flex items-center justify-between p-5 rounded-md border border-border bg-card">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
          Coherence score
        </p>
        <p className={cn("text-4xl font-semibold tabular-nums", color)}>
          {score}
          <span className="text-lg text-muted-foreground font-normal">/100</span>
        </p>
      </div>
      <span className={cn("text-sm font-medium", color)}>{label}</span>
    </div>
  )
}

function ContradictionCard({ item }: { item: Contradiction }) {
  const config = severityConfig[item.severity]
  const Icon = config.icon

  return (
    <div className={cn("rounded-md border p-5 space-y-4", config.className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{item.summary}</p>
        </div>
        <span className="text-xs font-mono shrink-0 opacity-70">{config.label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium opacity-60 uppercase tracking-widest">Section A</p>
          <blockquote className="text-sm border-l-2 border-current pl-3 opacity-80 leading-relaxed">
            {item.sectionA}
          </blockquote>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium opacity-60 uppercase tracking-widest">Section B</p>
          <blockquote className="text-sm border-l-2 border-current pl-3 opacity-80 leading-relaxed">
            {item.sectionB}
          </blockquote>
        </div>
      </div>

      <div className="space-y-1 pt-1 border-t border-current/10">
        <p className="text-xs font-medium opacity-60 uppercase tracking-widest">Suggested rewrite</p>
        <p className="text-sm leading-relaxed opacity-90">{item.suggestedRewrite}</p>
      </div>
    </div>
  )
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const high = result.contradictions.filter((c) => c.severity === "high")
  const medium = result.contradictions.filter((c) => c.severity === "medium")
  const low = result.contradictions.filter((c) => c.severity === "low")
  const sorted = [...high, ...medium, ...low]

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Analysis results</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {(result.analysisMs / 1000).toFixed(1)}s
        </span>
      </div>

      <CoherenceScore score={result.coherenceScore} />

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No contradictions found. Your spec looks coherent.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Found{" "}
            <span className="font-medium text-foreground">{sorted.length}</span>{" "}
            contradiction{sorted.length !== 1 ? "s" : ""}{high.length > 0 && ` — ${high.length} high severity`}.
          </p>
          {sorted.map((item) => (
            <ContradictionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
