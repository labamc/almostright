import Link from "next/link"

interface Stats {
  analyses: number
  contradictions: number
  hoursSaved: number
}

async function getStats(): Promise<Stats | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const pipeline = [
      ["GET", "almostright:analyses"],
      ["GET", "almostright:contradictions"],
      ["GET", "almostright:hours_saved"],
    ]

    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
      cache: "no-store",
    })

    if (!res.ok) return null
    const data: Array<{ result: string | null }> = await res.json()

    return {
      analyses: parseInt(data[0]?.result ?? "0") || 0,
      contradictions: parseInt(data[1]?.result ?? "0") || 0,
      hoursSaved: parseFloat(data[2]?.result ?? "0") || 0,
    }
  } catch {
    return null
  }
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-6 rounded-md border border-border bg-card space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-4xl font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default async function StatsPage() {
  const stats = await getStats()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/"
              className="text-xs font-mono tracking-widest text-muted-foreground uppercase hover:text-foreground transition-colors"
            >
              ← AlmostRight
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">Usage stats</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            How many specs we&apos;ve analyzed and how much rework we&apos;ve helped avoid.
          </p>
        </header>

        {stats === null ? (
          <div className="px-4 py-3 rounded-md border border-border bg-card text-sm text-muted-foreground">
            Stats tracking is not configured. Add{" "}
            <code className="font-mono text-foreground">UPSTASH_REDIS_REST_URL</code> and{" "}
            <code className="font-mono text-foreground">UPSTASH_REDIS_REST_TOKEN</code> to enable it.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Specs analyzed"
              value={stats.analyses.toLocaleString()}
            />
            <StatCard
              label="Contradictions caught"
              value={stats.contradictions.toLocaleString()}
            />
            <StatCard
              label="Hours of rework avoided"
              value={`~${stats.hoursSaved % 1 === 0 ? stats.hoursSaved : stats.hoursSaved.toFixed(1)}`}
              sub="across all specs"
            />
          </div>
        )}

        <p className="mt-12 text-xs text-muted-foreground">
          Built with{" "}
          <a
            href="https://atono.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-2"
          >
            Atono
          </a>{" "}
          — plan, build, flag, and measure your product with AI.
        </p>
      </div>
    </main>
  )
}
