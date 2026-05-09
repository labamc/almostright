"use client"

import { useState } from "react"
import { AlertTriangle, AlertCircle, Info, Clock, ExternalLink, Wand2, Download, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult, Contradiction, Severity } from "@/lib/types"

interface ResultsDisplayProps {
  result: AnalysisResult
  spec: string
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

function HoursSaved({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = high + medium + low
  if (total === 0) return null
  const hours = high * 4 + medium * 2 + low * 0.5
  const hoursLabel = hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-md border border-border bg-card text-sm">
      <span className="text-muted-foreground">
        {total} contradiction{total !== 1 ? "s" : ""} caught
        {high > 0 && <span className="ml-1 opacity-60">— {high} high severity</span>}
      </span>
      <span className="font-medium text-foreground">~{hoursLabel} of rework avoided</span>
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

function exportMarkdown(result: AnalysisResult, contradictions: Contradiction[]) {
  const date = new Date().toISOString().split("T")[0]
  const high = contradictions.filter((c) => c.severity === "high")
  const medium = contradictions.filter((c) => c.severity === "medium")
  const low = contradictions.filter((c) => c.severity === "low")
  const hours = high.length * 4 + medium.length * 2 + low.length * 0.5
  const hoursLabel = hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`

  const sections = contradictions.map((c, i) =>
    [
      `## ${i + 1}. [${c.severity.toUpperCase()}] ${c.summary}`,
      ``,
      `**Section A:**`,
      `> ${c.sectionA}`,
      ``,
      `**Section B:**`,
      `> ${c.sectionB}`,
      ``,
      `**Suggested rewrite:** ${c.suggestedRewrite}`,
    ].join("\n")
  )

  const content = [
    `# AlmostRight Analysis — ${date}`,
    ``,
    `**Coherence score:** ${result.coherenceScore}/100`,
    `**Contradictions found:** ${contradictions.length}`,
    `**Estimated rework avoided:** ~${hoursLabel}`,
    ``,
    `---`,
    ``,
    sections.join("\n\n"),
  ].join("\n")

  const blob = new Blob([content], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `almostright-${date}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export function ResultsDisplay({ result, spec }: ResultsDisplayProps) {
  const high = result.contradictions.filter((c) => c.severity === "high")
  const medium = result.contradictions.filter((c) => c.severity === "medium")
  const low = result.contradictions.filter((c) => c.severity === "low")
  const sorted = [...high, ...medium, ...low]

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Analysis results</h2>
        <div className="flex items-center gap-4">
          {sorted.length > 0 && (
            <button
              type="button"
              onClick={() => exportMarkdown(result, sorted)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          )}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {(result.analysisMs / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      <CoherenceScore score={result.coherenceScore} />

      <HoursSaved high={high.length} medium={medium.length} low={low.length} />

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No contradictions found. Your spec looks coherent.
        </p>
      ) : (
        <div className="space-y-4">
          {sorted.map((item) => (
            <ContradictionCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {sorted.length > 0 && <CTAPanel contradictions={sorted} spec={spec} />}
    </div>
  )
}

function CTAPanel({ contradictions, spec }: { contradictions: Contradiction[]; spec: string }) {
  const [copied, setCopied] = useState(false)

  const specSection = spec
    ? `\n\nORIGINAL SPEC:\n---\n${spec}\n---`
    : ""

  const fixPrompt = [
    "I ran my product spec through AlmostRight and found the following contradictions. Please apply the suggested rewrites, preserve my voice, structure, and formatting, then return the full corrected spec.\n\nContradictions to fix:\n",
    ...contradictions.map(
      (c, i) =>
        `${i + 1}. [${c.severity.toUpperCase()}] ${c.summary}\n   Section A: "${c.sectionA}"\n   Section B: "${c.sectionB}"\n   Suggested rewrite: ${c.suggestedRewrite}`
    ),
    specSection,
  ].join("\n")

  async function handleFixWithClaude() {
    try {
      await navigator.clipboard.writeText(fixPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // clipboard unavailable — still open Claude
    }
    window.open("https://claude.ai/new", "_blank")
  }

  return (
    <div className="mt-8 rounded-md border border-border bg-card p-6 space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">What&apos;s next?</p>
        <p className="text-sm text-muted-foreground">
          Fix these contradictions now, or prevent them from being written in the first place.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href="https://atono.io"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5",
            "bg-primary text-primary-foreground text-sm font-medium",
            "hover:opacity-90 active:opacity-80 transition-opacity"
          )}
        >
          <ExternalLink className="h-4 w-4" />
          Start building in Atono
        </a>

        <button
          type="button"
          onClick={handleFixWithClaude}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5",
            "border border-border bg-background text-foreground text-sm font-medium",
            "hover:bg-muted active:opacity-80 transition-colors"
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copied — paste into Claude
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Fix with Claude
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Atono grounds your team&apos;s AI workflow in your product context — so contradictions like these are caught
        before the spec is written.
      </p>
    </div>
  )
}
