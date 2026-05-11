"use client"

import { useState } from "react"
import { Mail, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/types"

interface StickyEmailBarProps {
  result: AnalysisResult
  spec: string
}

export function StickyEmailBar({ result, spec }: StickyEmailBarProps) {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, result, spec }),
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

  const total = result.issues.length
  const hasIssues = total > 0
  const prefixText = hasIssues
    ? `${total} issue${total !== 1 ? "s" : ""} found —`
    : "Spec looks clean —"
  const buttonText = hasIssues ? "Send me the fix" : "Send me the report"

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "border-t border-border bg-background/95 backdrop-blur-sm",
      "px-4 py-3 sm:px-6"
    )}>
      <div className="max-w-3xl mx-auto">
        {sent ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              Report sent — check your inbox for the Claude-ready fix file
            </div>
            <a
              href="https://atono.io/product-glossary"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-4"
            >
              Prevent this at the source →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1.5 sm:hidden">
                {hasIssues ? `${total} issue${total !== 1 ? "s" : ""} found — get the Claude-ready fix file` : "Spec looks clean — get your analysis report"}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground hidden sm:block shrink-0">
                  {prefixText}
                </p>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    disabled={sending}
                    className={cn(
                      "w-full pl-8 pr-3 py-2 rounded-md border border-input bg-card",
                      "text-sm text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2",
                "bg-primary text-primary-foreground text-sm font-medium shrink-0",
                "hover:opacity-90 active:opacity-80 transition-opacity",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {sending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
              ) : (
                buttonText
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
