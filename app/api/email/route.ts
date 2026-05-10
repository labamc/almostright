import { Resend } from "resend"
import type { AnalysisResult, IssueType } from "@/lib/types"

const resend = new Resend(process.env.RESEND_API_KEY)

const TYPE_LABELS: Record<IssueType, { label: string; description: string }> = {
  contradiction: { label: "Contradictions", description: "these can't both be true" },
  scope_landmine: { label: "Scope landmines", description: "these are bigger than they look" },
  missing_edge_case: { label: "Missing edge cases", description: "what happens when this goes wrong?" },
  ambiguity: { label: "Ambiguities", description: "these will need a clarification conversation" },
  unstated_assumption: { label: "Unstated assumptions", description: "your engineer will guess here" },
  untestable: { label: "Untestable requirements", description: "nobody will know when this is done" },
}

const ISSUE_TYPE_ORDER: IssueType[] = [
  "contradiction",
  "scope_landmine",
  "missing_edge_case",
  "ambiguity",
  "unstated_assumption",
  "untestable",
]

const SEVERITY_COLOR: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#94a3b8",
}

function buildEmailHtml(result: AnalysisResult): string {
  const grouped = ISSUE_TYPE_ORDER.flatMap((type) => {
    const issues = result.issues.filter((i) => i.type === type)
    return issues.length > 0 ? [{ type, issues }] : []
  })

  const sectionsHtml = grouped.map(({ type, issues }) => {
    const config = TYPE_LABELS[type]
    const issuesHtml = issues.map((issue) => {
      const excerptHtml =
        issue.type === "contradiction" && issue.conflictingExcerpt
          ? `<p style="margin:8px 0 4px;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Section A</p>
             <blockquote style="margin:0 0 8px;padding:0 0 0 12px;border-left:2px solid #e5e5e5;color:#555;font-size:14px;">${issue.excerpt}</blockquote>
             <p style="margin:8px 0 4px;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;">Section B</p>
             <blockquote style="margin:0 0 8px;padding:0 0 0 12px;border-left:2px solid #e5e5e5;color:#555;font-size:14px;">${issue.conflictingExcerpt}</blockquote>`
          : `<blockquote style="margin:8px 0;padding:0 0 0 12px;border-left:2px solid #e5e5e5;color:#555;font-size:14px;">${issue.excerpt}</blockquote>`

      return `<div style="margin-bottom:16px;padding:14px;border:1px solid #e5e5e5;border-radius:6px;">
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${SEVERITY_COLOR[issue.severity]};margin-top:5px;flex-shrink:0;"></span>
          <p style="margin:0;font-size:14px;font-weight:500;line-height:1.4;">${issue.summary}</p>
        </div>
        ${excerptHtml}
        <p style="margin:8px 0 2px;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.05em;">${issue.type === "missing_edge_case" ? "What to add" : "Suggested fix"}</p>
        <p style="margin:0;font-size:14px;color:#333;">${issue.suggestedFix}</p>
      </div>`
    }).join("")

    return `<div style="margin-bottom:28px;">
      <h2 style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">${config.label}</h2>
      <p style="margin:0 0 12px;font-size:13px;color:#888;">— ${config.description}</p>
      ${issuesHtml}
    </div>`
  }).join("")

  const total = result.issues.length
  const typeCount = new Set(result.issues.map((i) => i.type)).size

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
    <div style="padding:32px 32px 24px;">
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:600;color:#1a1a1a;">Your AlmostRight report</h1>
      <p style="margin:0 0 4px;font-size:14px;color:#666;">Coherence score: <strong>${result.coherenceScore}/100</strong></p>
      <p style="margin:0;font-size:14px;color:#666;">${total} issue${total !== 1 ? "s" : ""} across ${typeCount} type${typeCount !== 1 ? "s" : ""} — caught before your sprint</p>
    </div>

    <div style="height:1px;background:#e5e5e5;margin:0 32px;"></div>

    <div style="padding:24px 32px 8px;">
      ${sectionsHtml}
    </div>

    <div style="height:1px;background:#e5e5e5;margin:0 32px;"></div>

    <div style="padding:24px 32px 32px;">
      <p style="margin:0 0 12px;font-size:14px;color:#555;">Built by Adam Cheney — if this caught something real in your spec, I'd love to hear about it.</p>
      <a href="https://calendly.com/adam-cheney-atono/book-a-time-with-adam"
         style="display:inline-block;padding:10px 20px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
        → Book a time with Adam
      </a>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: Request) {
  const { email, result } = await req.json() as { email: string; result: AnalysisResult }

  if (!email || !email.includes("@")) {
    return Response.json({ error: "Valid email required." }, { status: 400 })
  }

  const total = result.issues.length

  try {
    await resend.emails.send({
      from: "AlmostRight <onboarding@resend.dev>",
      to: email,
      replyTo: "adam.cheney@atono.io",
      subject: `Your AlmostRight report — ${total} issue${total !== 1 ? "s" : ""} found`,
      html: buildEmailHtml(result),
    })

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "Failed to send email. Please try again." }, { status: 500 })
  }
}
