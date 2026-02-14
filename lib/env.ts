const requiredServerVars = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NVIDIA_API_KEY",
  "NEYNAR_API_KEY",
] as const;

let validated = false;

export function validateEnv() {
  if (validated) return;
  validated = true;

  const missing: string[] = [];
  for (const varName of requiredServerVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[env] Missing required environment variables:\n  ${missing.join("\n  ")}\nCheck your .env.local file.`
    );
  }
}
