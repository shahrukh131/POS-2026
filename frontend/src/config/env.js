const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/** Backend base URL without a trailing slash. Set VITE_API_URL in .env to override. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
