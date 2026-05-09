import { Atono } from "@atono-io/server-sdk"

// Singleton — initialized once per server process
let featureFlagsPromise: ReturnType<InstanceType<typeof Atono>["getFeatureFlags"]> | null = null

function getFeatureFlags() {
  if (!featureFlagsPromise) {
    const envKey = process.env.ATONO_ENV_KEY
    if (!envKey) {
      throw new Error("ATONO_ENV_KEY is not set")
    }
    const atono = Atono.fromEnvironmentKey(envKey)
    featureFlagsPromise = atono.getFeatureFlags()
  }
  return featureFlagsPromise
}

export async function isEnabled(flagName: string, context?: Record<string, string>): Promise<boolean> {
  try {
    const flags = await getFeatureFlags()
    const evalContext = flags.makeEvaluationContext(context ?? {})
    return flags.getBooleanValue(flagName, false, evalContext)
  } catch {
    // Fail open — if Atono is unreachable, don't block the feature
    return true
  }
}
