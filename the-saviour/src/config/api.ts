export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://saviour-backend-1.onrender.com";
export const AI_CORE_URL = process.env.NEXT_PUBLIC_AI_CORE_URL || "https://saviour-ai-core.onrender.com";
export const AI_CORE_WS_URL = AI_CORE_URL.replace("https://", "wss://").replace("http://", "ws://");
