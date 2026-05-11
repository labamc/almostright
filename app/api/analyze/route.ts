import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import type { AnalysisResult, SpecIssue } from "@/lib/types"
import { isEnabled } from "@/lib/feature-flags"

function logAnalysis(issues: SpecIssue[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return

  const pipeline: Array<[string, ...unknown[]]> = [
    ["INCR", "almostright:analyses"],
    ["INCRBY", "almostright:issues", issues.length],
  ]

  const typeCounts = issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1
    return acc
  }, {})

  for (const [type, count] of Object.entries(typeCounts)) {
    pipeline.push(["INCRBY", `almostright:issues:${type}`, count])
  }

  fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(pipeline),
  }).catch(() => {})
}

const FLAG = "contradiction_analysis"

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a product spec analyst. Your job is to find issues in product specifications that would cause problems for engineering teams — mid-sprint surprises, scope creep, bugs, or wasted work.

Analyze the spec for issues across these 6 types:

1. contradiction — Two requirements that cannot both be true. The spec says X in one place and not-X in another.
   Severity: high = logical impossibility; medium = conflicting priorities; low = inconsistent phrasing.

2. ambiguity — A requirement that is underspecified and will force a clarification conversation mid-sprint. Something an engineer would have to guess at or ask the PM about.
   Severity: high = core behavior undefined; medium = important edge behavior unclear; low = minor terminology uncertainty.

3. scope_landmine — A phrase or requirement that sounds simple but hides significant unexpected complexity. Watch for: "seamlessly", "all platforms", "real-time", "just", "simple", "integrate with X", "support all", "automatically".
   Severity: high = weeks of hidden work; medium = days; low = hours.

4. missing_edge_case — The spec defines the happy path but says nothing about what happens when something goes wrong, is empty, fails, or hits a limit.
   Severity: high = core flow has no error handling; medium = important secondary flow missing; low = minor state undefined.

5. unstated_assumption — A requirement that implies something the spec never actually states. Performance SLAs, scale targets, browser support, data retention, access control, third-party dependencies.
   Severity: high = will cause a production incident; medium = will cause a planning failure; low = will cause a clarification meeting.

6. untestable — A requirement with no clear acceptance criterion. Nobody can ship it because nobody knows when it's done. Watch for: "feels intuitive", "should be fast", "users will love", "seamless experience", "delightful".
   Severity: high = entire feature unmeasurable; medium = key behavior unmeasurable; low = secondary quality unmeasurable.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "coherenceScore": <integer 0-100, where 100 = no issues found, below 50 = significant problems>,
  "issues": [
    {
      "id": "<short unique string>",
      "type": "<contradiction|ambiguity|scope_landmine|missing_edge_case|unstated_assumption|untestable>",
      "severity": "<high|medium|low>",
      "summary": "<one sentence describing the issue>",
      "excerpt": "<verbatim or near-verbatim quote from the spec showing the issue>",
      "conflictingExcerpt": "<ONLY for contradictions: the second quote that conflicts with excerpt — omit this field for all other types>",
      "suggestedFix": "<a concrete, specific fix — rewritten text or exactly what needs to be added>"
    }
  ]
}

Rules:
- Only include real issues. Do not invent problems that are not there.
- Prioritize issues that would actually disrupt a sprint or cause a bug.
- Cap at 20 total issues. If there are more, include only the highest severity ones.
- For scope_landmine, quote the specific phrase that hides the complexity.
- For untestable, quote the vague phrase and suggest a measurable alternative in suggestedFix.
- If there are no issues, return an empty array and coherenceScore of 95 or above.
- Do not include markdown, code fences, or any text outside the JSON object.`

export async function POST(req: Request) {
  try {
    const { spec } = await req.json()

    const flagEnabled = isEnabled(FLAG)
    if (!flagEnabled) {
      return NextResponse.json(
        { error: "Spec analysis is not available in this environment." },
        { status: 403 }
      )
    }

    if (!spec || typeof spec !== "string" || spec.trim().length < 10) {
      return NextResponse.json({ error: "Spec is too short to analyze." }, { status: 400 })
    }

    if (spec.length > 100_000) {
      return NextResponse.json({ error: "Spec exceeds the 100,000 character limit." }, { status: 400 })
    }

    const start = Date.now()

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this product spec for issues:\n\n${spec}`,
        },
      ],
    })

    const analysisMs = Date.now() - start

    const raw = message.content[0]
    if (raw.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from analysis service." }, { status: 500 })
    }

    let parsed: { coherenceScore: number; issues: SpecIssue[] }
    try {
      const cleaned = raw.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({ error: "Failed to parse analysis response." }, { status: 500 })
    }

    const result: AnalysisResult = {
      coherenceScore: parsed.coherenceScore,
      issues: parsed.issues,
      analysisMs,
    }

    logAnalysis(parsed.issues)

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Analysis service error: ${err.message}` },
        { status: err.status ?? 500 }
      )
    }
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
}
