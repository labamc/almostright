"use client"

import {
  Clock,
  XCircle,
  HelpCircle,
  Flame,
  AlertTriangle,
  EyeOff,
  Ban,
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

      <div className="pl-5 pt-1 border-t border-current/10">
        <p className="text-xs text-muted-foreground italic">
          Fix included in your report — enter your email below to get it.
        </p>
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
    <div className="mt-10 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Analysis results</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {(result.analysisMs / 1000).toFixed(1)}s
        </span>
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

    </div>
  )
}
