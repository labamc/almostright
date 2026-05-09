import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import type { AnalysisResult } from "@/lib/types"
import { isEnabled } from "@/lib/feature-flags"

const FLAG = "contradiction_analysis"

const client = new Anthropic()

const SYSTEM_PROMPT = `You are a product spec analyst. Your job is to find contradictions in product specifications —
places where the spec says two things that cannot both be true, or where requirements conflict.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "coherenceScore": <integer 0-100>,
  "contradictions": [
    {
      "id": "<short unique string>",
      "severity": "<high|medium|low>",
      "summary": "<one sentence describing the contradiction>",
      "sectionA": "<verbatim or near-verbatim quote from the spec>",
      "sectionB": "<verbatim or near-verbatim quote that conflicts with sectionA>",
      "suggestedRewrite": "<a concrete rewrite that resolves the conflict>"
    }
  ]
}

Severity guide:
- high: Direct logical contradiction (e.g. feature must be real-time AND must work offline)
- medium: Tension that creates ambiguity for an engineer (e.g. conflicting priorities)
- low: Minor inconsistency in tone, scope, or phrasing that could cause confusion

If there are no contradictions, return an empty array and a high coherence score.
Do not include markdown, code fences, or any text outside the JSON object.`

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

    if (spec.length > 50_000) {
      return NextResponse.json({ error: "Spec exceeds the 50,000 character limit." }, { status: 400 })
    }

    const start = Date.now()

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this product spec for contradictions:\n\n${spec}`,
        },
      ],
    })

    const analysisMs = Date.now() - start

    const raw = message.content[0]
    if (raw.type !== "text") {
      return NextResponse.json({ error: "Unexpected response from analysis service." }, { status: 500 })
    }

    let parsed: { coherenceScore: number; contradictions: AnalysisResult["contradictions"] }
    try {
      parsed = JSON.parse(raw.text)
    } catch {
      return NextResponse.json({ error: "Failed to parse analysis response." }, { status: 500 })
    }

    const result: AnalysisResult = {
      coherenceScore: parsed.coherenceScore,
      contradictions: parsed.contradictions,
      analysisMs,
    }

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
