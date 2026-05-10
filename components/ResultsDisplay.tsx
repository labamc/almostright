"use client"

import { useState } from "react"
import {
  Clock,
  ExternalLink,
  Download,
  Check,
  XCircle,
  HelpCircle,
  Flame,
  AlertTriangle,
  EyeOff,
  Ban,
  Mail,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult, SpecIssue, IssueType, Severity } from "@/lib/types"

interface ResultsDisplayProps {
  result: AnalysisResult
}

const ISSUE_TYPE_ORDER: IssueType[] = [
  "contradiction",
  "scope_landmine",
  "missing_edge_case",
  "ambiguity",
  "unstated_assumption",
  "untestable",
]

const typeConfig: Record<
  IssueType,
  { label: string; description: string; icon: React.ElementType; headerClass: string; cardClass: string }
> = {
  contradiction: {
    label: "Contradictions",
    description: "these can't both be true",
    icon: XCircle,
    headerClass: "text-red-700 dark:text-red-400",
    cardClass: "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/30",
  },
  scope_landmine: {
    label: "Scope landmines",
    description: "these are bigger than they look",
    icon: Flame,
    headerClass: "text-orange-700 dark:text-orange-400",
    cardClass: "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/30",
  },
  missing_edge_case: {
    label: "Missing edge cases",
    description: "what happens when this goes wrong?",
    icon: AlertTriangle,
    headerClass: "text-yellow-700 dark:text-yellow-400",
    cardClass: "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/30",
  },
  ambiguity: {
    label: "Ambiguities",
    description: "these will need a clarification conversation",
    icon: HelpCircle,
    headerClass: "text-amber-700 dark:text-amber-400",
    cardClass: "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/30",
  },
  unstated_assumption: {
    label: "Unstated assumptions",
    description: "your engineer will guess here",
    icon: EyeOff,
    headerClass: "text-blue-700 dark:text-blue-400",
    cardClass: "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/30",
  },
  untestable: {
    label: "Untestable requirements",
    description: "nobody will know when this is done",
    icon: Ban,
    headerClass: "text-purple-700 dark:text-purple-400",
    cardClass: "border-purple-200 bg-purple-50/50 dark:border-purple-900/50 dark:bg-purple-950/30",
  },
}

const severityDot: Record<Severity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
}

function CoherenceScore({ score }: { score: number }) {
  const label = score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Weak"
  const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600"

  return (
    <div className="flex items-center justify-between p-5 rounded-md border border-border bg-card">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Coherence score</p>
        <p className={cn("text-4xl font-semibold tabular-nums", color)}>
          {score}
          <span className="text-lg text-muted-foreground font-normal">/100</span>
        </p>
      </div>
      <span className={cn("text-sm font-medium", color)}>{label}</span>
    </div>
  )
}

function IssuesSummary({ issues }: { issues: SpecIssue[] }) {
  const total = issues.length
  const typeCount = new Set(issues.map((i) => i.type)).size
  if (total === 0) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-md border border-border bg-card text-sm">
      <span className="text-muted-foreground">
        {total} issue{total !== 1 ? "s" : ""} across {typeCount} type{typeCount !== 1 ? "s" : ""}
      </span>
      <span className="font-medium text-foreground">caught before your sprint</span>
    </div>
  )
}

function IssueCard({ issue }: { issue: SpecIssue }) {
  const config = typeConfig[issue.type]

  return (
    <div className={cn("rounded-md border p-4 space-y-3", config.cardClass)}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", severityDot[issue.severity])} />
        <p className="text-sm font-medium leading-snug flex-1">{issue.summary}</p>
        <span className="text-xs font-mono opacity-50 shrink-0 capitalize">{issue.severity}</span>
      </div>

      {issue.type === "contradiction" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-5">
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-50 uppercase tracking-widest">Section A</p>
            <blockquote className="text-sm border-l-2 border-current/30 pl-3 opacity-80 leading-relaxed">
              {issue.excerpt}
            </blockquote>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-50 uppercase tracking-widest">Section B</p>
            <blockquote className="text-sm border-l-2 border-current/30 pl-3 opacity-80 leading-relaxed">
              {issue.conflictingExcerpt}
            </blockquote>
          </div>
        </div>
      ) : (
        <blockquote className="text-sm border-l-2 border-current/30 pl-3 opacity-80 leading-relaxed ml-5">
          {issue.excerpt}
        </blockquote>
      )}

      <div className="pl-5 space-y-0.5 pt-1 border-t border-current/10">
        <p className="text-xs font-medium opacity-50 uppercase tracking-widest">
          {issue.type === "missing_edge_case" ? "What to add" : "Suggested fix"}
        </p>
        <p className="text-sm leading-relaxed opacity-90">{issue.suggestedFix}</p>
      </div>
    </div>
  )
}

function TypeSection({ type, issues }: { type: IssueType; issues: SpecIssue[] }) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 shrink-0", config.headerClass)} />
        <h3 className={cn("text-sm font-semibold", config.headerClass)}>{config.label}</h3>
        <span className="text-xs text-muted-foreground">— {config.description}</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono tabular-nums">{issues.length}</span>
      </div>
      <div className="space-y-3">
        {issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  )
}

function exportMarkdown(result: AnalysisResult, issues: SpecIssue[]) {
  const date = new Date().toISOString().split("T")[0]

  const sections = ISSUE_TYPE_ORDER.flatMap((type) => {
    const group = issues.filter((i) => i.type === type)
    if (group.length === 0) return []
    const config = typeConfig[type]
    return [
      `## ${config.label}`,
      `*${config.description}*`,
      ``,
      ...group.map((issue, i) =>
        [
          `### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.summary}`,
          ``,
          issue.type === "contradiction"
            ? `**Section A:** > ${issue.excerpt}\n\n**Section B:** > ${issue.conflictingExcerpt}`
            : `> ${issue.excerpt}`,
          ``,
          `**${issue.type === "missing_edge_case" ? "What to add" : "Suggested fix"}:** ${issue.suggestedFix}`,
        ].join("\n")
      ),
    ]
  })

  const content = [
    `# AlmostRight Analysis — ${date}`,
    ``,
    `**Coherence score:** ${result.coherenceScore}/100`,
    `**Issues found:** ${issues.length} across ${new Set(issues.map((i) => i.type)).size} types`,
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

function getCTACopy(issues: SpecIssue[]): string {
  const types = new Set(issues.map((i) => i.type))
  if (types.has("ambiguity") && types.has("untestable"))
    return "Atono generates acceptance criteria and grounds specs in shared context — so requirements are clear and testable before engineering starts."
  if (types.has("scope_landmine"))
    return "Atono surfaces scope implications before you write the spec — so hidden complexity gets planned, not discovered mid-sprint."
  if (types.has("ambiguity"))
    return "Atono's AI context and glossary prevent ambiguities by grounding specs in your team's shared decisions."
  if (types.has("untestable"))
    return "Atono generates acceptance criteria automatically from your stories — so requirements are testable by design."
  if (types.has("unstated_assumption"))
    return "Atono captures your team's product context so assumptions get documented as requirements, not discovered as incidents."
  return "Atono grounds your team's AI workflow in your product context — so issues like these are caught before the spec is written."
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  const grouped = ISSUE_TYPE_ORDER.map((type) => ({
    type,
    issues: result.issues
      .filter((i) => i.type === type)
      .sort((a, b) => {
        const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 }
        return order[a.severity] - order[b.severity]
      }),
  })).filter(({ issues }) => issues.length > 0)

  const allIssues = grouped.flatMap(({ issues }) => issues)

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Analysis results</h2>
        <div className="flex items-center gap-4">
          {allIssues.length > 0 && (
            <button
              type="button"
              onClick={() => exportMarkdown(result, allIssues)}
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

      <IssuesSummary issues={allIssues} />

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No issues found. Your spec looks solid.</p>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ type, issues }) => (
            <TypeSection key={type} type={type} issues={issues} />
          ))}
        </div>
      )}

      {allIssues.length > 0 && <CTAPanel issues={allIssues} result={result} />}
    </div>
  )
}

function CTAPanel({ issues, result }: { issues: SpecIssue[]; result: AnalysisResult }) {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendReport(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, result }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        setError(msg ?? "Something went wrong. Please try again.")
        return
      }
      setSent(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-8 rounded-md border border-border bg-card p-6 space-y-5">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">What&apos;s next?</p>
        <p className="text-sm text-muted-foreground">{getCTACopy(issues)}</p>
      </div>

      <div className="space-y-3">
        {sent ? (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" />
            Report sent — check your inbox
          </div>
        ) : (
          <form onSubmit={handleSendReport} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={sending}
                className={cn(
                  "w-full pl-9 pr-4 py-2.5 rounded-md border border-input bg-background",
                  "text-sm text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5",
                "bg-primary text-primary-foreground text-sm font-medium",
                "hover:opacity-90 active:opacity-80 transition-opacity",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send me this report"
              )}
            </button>
          </form>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <p className="text-xs text-muted-foreground">
          We&apos;ll email your full report. No spam — just this.
        </p>
      </div>

      <div className="pt-2 border-t border-border">
        <a
          href="https://atono.io/product-glossary"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
            "hover:text-foreground transition-colors"
          )}
        >
          Fix the root cause in Atono
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
