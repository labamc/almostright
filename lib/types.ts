export type Severity = "high" | "medium" | "low"

export interface Contradiction {
  id: string
  severity: Severity
  summary: string
  sectionA: string
  sectionB: string
  suggestedRewrite: string
}

export interface AnalysisResult {
  coherenceScore: number
  contradictions: Contradiction[]
  analysisMs: number
}
