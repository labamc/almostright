export type Severity = "high" | "medium" | "low"

export type IssueType =
  | "contradiction"
  | "ambiguity"
  | "scope_landmine"
  | "missing_edge_case"
  | "unstated_assumption"
  | "untestable"

export interface SpecIssue {
  id: string
  type: IssueType
  severity: Severity
  summary: string
  excerpt: string
  conflictingExcerpt?: string
  suggestedFix: string
  contextGap: string
}

export interface AnalysisResult {
  coherenceScore: number
  issues: SpecIssue[]
  analysisMs: number
}
