// API base URL resolution:
// 1. NEXT_PUBLIC_API_URL env var (set per-environment in .env.local / deployment)
// 2. localhost fallback for local development
// NOTE: the deployed frontend should always set NEXT_PUBLIC_API_URL to the
// deployed backend URL - there is no hardcoded production URL here anymore.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Bid increment rules shared with the server (display only - the server enforces)
export const getIncrementAmount = (currentBid) => {
  const pct = Math.round(currentBid * 0.05);
  return Math.max(5, Math.round(pct / 5) * 5); // 5% of bid, rounded to nearest 5, min 5
};
