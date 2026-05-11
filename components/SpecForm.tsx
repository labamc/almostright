"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Loader2, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/types"

const MAX_FILE_BYTES = 10 * 1024 * 1024

const PROGRESS_MESSAGES = [
  "Scanning for contradictions…",
  "Checking for scope landmines…",
  "Looking for missing edge cases…",
  "Flagging ambiguous requirements…",
  "Surfacing unstated assumptions…",
  "Checking for untestable requirements…",
  "Almost done…",
]
const ACCEPTED = ".txt,.md,.pdf,.docx"

const SAMPLE_SPEC = `# Role Management

Workspace owners need to assign, update, and revoke user roles without engineering involvement.

Roles available: Viewer, Contributor, Manager, and Admin. Admins have full access to all features including billing. Managers can create and assign work but cannot access billing or workspace settings.

Changes to roles take effect immediately across the platform. Users should not experience any disruption while actively working when their role changes.

All role changes must be logged for compliance purposes. Logs must be retained for as long as legally required.

Workspace owners can bulk-update roles via CSV upload for large teams. The import should be simple and handle errors gracefully.

New users added to the workspace default to the Contributor role unless specified. Users invited via SSO inherit their role from the identity provider.

Success is when admins feel confident managing their team without needing to contact support.`

interface SpecFormProps {
  onResult: (result: AnalysisResult, spec: string) => void
  onError: (error: string) => void
}

export function SpecForm({ onResult, onError }: SpecFormProps) {
  const [spec, setSpec] = useState("")
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [progressIdx, setProgressIdx] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading) {
      setProgressIdx(0)
      return
    }
    const id = setInterval(() => {
      setProgressIdx((i) => (i + 1) % PROGRESS_MESSAGES.length)
    }, 2000)
    return () => clearInterval(id)
  }, [loading])

  async function extractFile(file: File) {
    if (file.size > MAX_FILE_BYTES) {
      onError("File is too large. Maximum size is 10 MB.")
      return
    }

    const ext = file.name.split(".").pop()?.toLowerCase()

    if (ext === "txt" || ext === "md") {
      const text = await file.text()
      setSpec(text)
      return
    }

    setExtracting(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/extract", { method: "POST", body: form })
      if (!res.ok) {
        const { error } = await res.json()
        onError(error ?? "Could not extract text from file.")
        return
      }
      const { text } = await res.json()
      setSpec(text)
    } catch {
      onError("Failed to extract file. Please try pasting the text instead.")
    } finally {
      setExtracting(false)
    }
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await extractFile(file)
    e.target.value = ""
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await extractFile(file)
  }, [])

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
      onResult(data, spec)
    } catch {
      onError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || extracting

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="spec" className="block text-sm font-medium text-foreground">
            Product spec
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSpec(SAMPLE_SPEC)}
              disabled={busy}
              className={cn(
                "text-xs text-muted-foreground",
                "hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              Try sample spec →
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
                "hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload file
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "rounded-md border transition-colors",
            dragging ? "border-ring bg-muted" : "border-input"
          )}
        >
          <textarea
            id="spec"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="Paste your spec here, or drop a .txt .md .pdf .docx file…"
            rows={12}
            disabled={busy}
            className={cn(
              "w-full resize-y rounded-md bg-card px-4 py-3",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "font-mono leading-relaxed"
            )}
          />
        </div>

        <p className="text-xs text-muted-foreground transition-opacity duration-300">
          {extracting ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Extracting text…
            </span>
          ) : loading ? (
            PROGRESS_MESSAGES[progressIdx]
          ) : (
            `${spec.trim().split(/\s+/).filter(Boolean).length} words`
          )}
        </p>
      </div>

      <button
        type="submit"
        disabled={busy || !spec.trim()}
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
