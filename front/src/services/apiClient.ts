export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface AuthResponse {
  token: string;
  tokenType: string;
  refreshToken: string;
}

const ACCESS_TOKEN_KEY = 'cc_access_token';
const REFRESH_TOKEN_KEY = 'cc_refresh_token';
const TOKEN_TYPE_KEY = 'cc_token_type';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getTokenType() {
  return localStorage.getItem(TOKEN_TYPE_KEY) ?? 'Bearer';
}

export function setTokens(auth: AuthResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
  localStorage.setItem(TOKEN_TYPE_KEY, auth.tokenType || 'Bearer');
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (response.status === 403) {
    throw new Error('No tenés permisos para realizar esta acción');
  }

  if (!response.ok) {
    const message =
      (isJson && typeof data === 'object' && data !== null && 'message' in data && data.message) ||
      (isJson && typeof data === 'object' && data !== null && 'error' in data && data.error) ||
      (typeof data === 'string' && data) ||
      `Request failed (${response.status})`;
    throw new Error(String(message));
  }

  return data as T;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse<AuthResponse>(response);
}

export async function refreshSession(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  return parseResponse<AuthResponse>(response);
}

let refreshPromise: Promise<AuthResponse> | null = null;

async function refreshTokensIfNeeded(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  const auth = await refreshPromise;
  setTokens(auth);
  return auth;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set('Authorization', `${getTokenType()} ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status !== 401) {
    return parseResponse<T>(response);
  }
  

  try {
    await refreshTokensIfNeeded();
  } catch (error) {
    clearTokens();
    throw error;
  }

  const retryHeaders = new Headers(options.headers ?? {});
  const retryAccessToken = getAccessToken();
  if (retryAccessToken) {
    retryHeaders.set('Authorization', `${getTokenType()} ${retryAccessToken}`);
  }

  const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: retryHeaders,
  });

  return parseResponse<T>(retryResponse);
}
