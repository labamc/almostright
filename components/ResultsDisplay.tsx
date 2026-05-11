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

const CALENDLY_URL = "https://calendly.com/adam-cheney-atono/book-a-time-with-adam"

const PREVENTION_MAP: Record<IssueType, { root: string; prevention: string }> = {
  ambiguity: {
    root: "These terms mean different things to different people on your team.",
    prevention: "A shared product glossary would have defined them before the spec was written.",
  },
  unstated_assumption: {
    root: "Your engineer will fill these gaps with their own interpretation.",
    prevention: "Shared product context would have made these assumptions explicit decisions.",
  },
  contradiction: {
    root: "A prior decision wasn't visible when this spec was written.",
    prevention: "Persistent design decisions on your stories would have flagged the conflict — not buried in a Slack thread.",
  },
  scope_landmine: {
    root: "The complexity wasn't visible from the spec alone.",
    prevention: "Your team's delivery history and prior story context would have surfaced it before the sprint started.",
  },
  missing_edge_case: {
    root: "Your product's user states weren't part of the writing context.",
    prevention: "Documented personas and product knowledge would have caught these gaps during writing.",
  },
  untestable: {
    root: "There's no shared definition of done for a requirement like this.",
    prevention: "Feature engagement data tied to stories turns 'success' into a number, not a feeling.",
  },
}

const RELEASE_PREVENTION = {
  root: "This spec assumes deploy equals release — no rollout strategy is defined.",
  prevention: "Feature flags tied directly to stories make deploy/release separation a deliberate spec decision, not a shipping-day scramble.",
}

function AtonoPreventionPanel({ issues }: { issues: SpecIssue[] }) {
  if (issues.length === 0) return null

  const foundTypes = [...new Set(issues.map((i) => i.type))]
  const items = foundTypes.map((type) => PREVENTION_MAP[type])

  const showReleaseItem = foundTypes.includes("scope_landmine") || foundTypes.includes("untestable")

  return (
    <div className="rounded-md border border-border bg-card p-5 space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        Where these issues came from
      </p>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-slate-400" />
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">{item.root}</p>
              <p className="text-sm text-foreground">{item.prevention}</p>
            </div>
          </div>
        ))}
        {showReleaseItem && (
          <div className="flex items-start gap-3">
            <span className="mt-1.5 h-2 w-2 rounded-full shrink-0 bg-slate-400" />
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">{RELEASE_PREVENTION.root}</p>
              <p className="text-sm text-foreground">{RELEASE_PREVENTION.prevention}</p>
            </div>
          </div>
        )}
      </div>
      <div className="pt-2 border-t border-border space-y-3">
        <p className="text-xs text-muted-foreground italic">
          64% of product knowledge lives in people&apos;s heads. AlmostRight just showed you the cost.
        </p>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-foreground hover:opacity-70 transition-opacity"
        >
          Book 15 min with Adam to see this prevented →
        </a>
      </div>
    </div>
  )
}

const severityDot: Record<Severity, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
}

function getSprintRisk(issues: SpecIssue[]): {
  level: "high" | "moderate" | "low" | "none"
  label: string
  consequence: string
  dot: string
  border: string
  bg: string
} {
  const high = issues.filter((i) => i.severity === "high").length
  const medium = issues.filter((i) => i.severity === "medium").length

  if (high > 0) return {
    level: "high",
    label: "High sprint risk",
    consequence: `${high} blocker${high !== 1 ? "s" : ""} will stop engineering mid-track`,
    dot: "bg-red-500",
    border: "border-red-200 dark:border-red-900/50",
    bg: "bg-red-50/50 dark:bg-red-950/20",
  }
  if (medium > 0) return {
    level: "moderate",
    label: "Moderate sprint risk",
    consequence: "Clarification conversations expected before or during engineering",
    dot: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-900/50",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
  }
  if (issues.length > 0) return {
    level: "low",
    label: "Low sprint risk",
    consequence: "Minor issues — safe to proceed, worth addressing before final review",
    dot: "bg-green-500",
    border: "border-green-200 dark:border-green-900/50",
    bg: "bg-green-50/50 dark:bg-green-950/20",
  }
  return {
    level: "none",
    label: "No issues found",
    consequence: "Your spec looks solid — ready for engineering",
    dot: "bg-green-500",
    border: "border-green-200 dark:border-green-900/50",
    bg: "bg-green-50/50 dark:bg-green-950/20",
  }
}

function SprintRiskIndicator({ issues }: { issues: SpecIssue[] }) {
  const risk = getSprintRisk(issues)

  return (
    <div className={cn("flex items-start gap-4 p-5 rounded-md border", risk.border, risk.bg)}>
      <span className={cn("mt-1 h-3 w-3 rounded-full shrink-0", risk.dot)} />
      <div>
        <p className="text-base font-semibold text-foreground">{risk.label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{risk.consequence}</p>
      </div>
    </div>
  )
}

function PriorityTier({
  label,
  consequence,
  issues,
  dot,
}: {
  label: string
  consequence: string
  issues: SpecIssue[]
  dot: string
}) {
  if (issues.length === 0) return null

  const types = [...new Set(issues.map((i) => typeConfig[i.type].label))]

  return (
    <div className="flex items-start gap-3">
      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", dot)} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{label} </span>
        <span className="text-sm text-muted-foreground">— {consequence}</span>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {types.map((type) => (
            <span
              key={type}
              className="inline-block px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground font-mono"
            >
              {type.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <span className="text-sm font-mono tabular-nums text-muted-foreground shrink-0">
        {issues.length}
      </span>
    </div>
  )
}

function PriorityTriage({ issues }: { issues: SpecIssue[] }) {
  if (issues.length === 0) return null

  const high = issues.filter((i) => i.severity === "high")
  const medium = issues.filter((i) => i.severity === "medium")
  const low = issues.filter((i) => i.severity === "low")

  return (
    <div className="rounded-md border border-border bg-card p-5 space-y-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        Priority breakdown
      </p>
      <div className="space-y-4">
        <PriorityTier
          label="Sprint blockers"
          consequence="fix before kickoff"
          issues={high}
          dot="bg-red-500"
        />
        <PriorityTier
          label="Worth addressing"
          consequence="will cause clarification conversations"
          issues={medium}
          dot="bg-amber-500"
        />
        <PriorityTier
          label="Nice to have"
          consequence="low risk, tidy up when you can"
          issues={low}
          dot="bg-slate-400"
        />
      </div>
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
          Fix included in your report — enter your email below to get it
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

      <SprintRiskIndicator issues={allIssues} />

      <PriorityTriage issues={allIssues} />

      <AtonoPreventionPanel issues={allIssues} />

      {grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No issues found. Your spec looks solid.</p>
      ) : (
        <div className="space-y-10">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">
              Full breakdown
            </p>
            <div className="space-y-10">
              {grouped.map(({ type, issues }) => (
                <TypeSection key={type} type={type} issues={issues} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
