export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  ENABLE_MSW: import.meta.env.VITE_ENABLE_MSW === 'true',
} as const;
