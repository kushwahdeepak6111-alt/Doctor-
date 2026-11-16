const TOKEN_STORAGE_KEY = 'arogya_session_token';
let inMemoryToken: string | null = null;

export function getSessionToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const fromSession = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (fromSession) {
        inMemoryToken = fromSession;
        return fromSession;
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const fromLocal = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (fromLocal) {
        inMemoryToken = fromLocal;
        return fromLocal;
      }
    }
  } catch {
    // Ignore storage access errors in restricted iframes
  }
  return null;
}

export function saveSessionToken(token: string | null | undefined): void {
  if (!token) return;
  inMemoryToken = token;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Ignore
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // Ignore
  }
}

export function clearSessionToken(): void {
  inMemoryToken = null;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getSessionToken();
  const headers = new Headers(
    init?.headers ?? (input instanceof Request ? input.headers : undefined)
  );
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}
