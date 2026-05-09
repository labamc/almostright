"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/types"

interface SpecFormProps {
  onResult: (result: AnalysisResult) => void
  onError: (error: string) => void
}

export function SpecForm({ onResult, onError }: SpecFormProps) {
  const [spec, setSpec] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!spec.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        onError(error ?? "Analysis failed. Please try again.")
        return
      }

      const data: AnalysisResult = await res.json()
      onResult(data)
    } catch {
      onError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="spec"
          className="block text-sm font-medium text-foreground"
        >
          Product spec
        </label>
        <textarea
          id="spec"
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          placeholder="Paste your spec here…"
          rows={12}
          disabled={loading}
          className={cn(
            "w-full resize-y rounded-md border border-input bg-card px-4 py-3",
            "text-sm text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "font-mono leading-relaxed transition-colors"
          )}
        />
        <p className="text-xs text-muted-foreground">
          {spec.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !spec.trim()}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-5 py-2.5",
          "bg-primary text-primary-foreground text-sm font-medium",
          "hover:opacity-90 active:opacity-80 transition-opacity",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          "Analyze spec"
        )}
      </button>
    </form>
  )
}
