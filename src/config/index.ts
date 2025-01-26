// src/config/index.ts

export const config = {
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || "http://localhost:8080",
    timeout: 30000,
  },
  features: {
    youtube: process.env.VITE_ENABLE_YOUTUBE === "true",
    webSearch: process.env.VITE_ENABLE_WEB_SEARCH === "true",
  },
  limits: {
    maxSearchResults: 10,
    maxRetries: 3,
  },
};
