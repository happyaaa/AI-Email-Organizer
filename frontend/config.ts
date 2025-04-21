export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    graphUrl: process.env.NEXT_PUBLIC_GRAPH_URL || "https://graph.microsoft.com/v1.0",
  },
} as const; 