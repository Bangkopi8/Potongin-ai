const FALLBACK_API_BASE_URL = 'http://localhost:4000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_API_BASE_URL;

export const apiConfig = {
  baseUrl: API_BASE_URL,
};
