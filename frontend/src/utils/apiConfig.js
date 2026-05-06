export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "https://elderly-ai-fo43.onrender.com"
).replace(/\/$/, "");

export function buildApiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
