export function isEnabled(flagName: string): boolean {
  const key = `FEATURE_${flagName.toUpperCase()}`
  const val = process.env[key]
  // Explicitly opt-out by setting to "false" or "0"; anything else (including missing) = enabled
  return val !== "false" && val !== "0"
}
