/**
 * Shared API access. Every call carries the admin token; a 401 answer means the session
 * is gone, so the token is dropped and the app goes back to the sign-in screen.
 */

// A production build served by the sync server itself talks to the same origin
const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');
export const API = `${BASE}/api/v1`;

const TOKEN_KEY = 'mobir_admin_token';
export const SIGNED_OUT_EVENT = 'mobir:signed-out';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private mode without storage: the session lasts until the page is reloaded
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
};

/** Subscribe to "session ended"; returns the unsubscribe function */
export const onSignedOut = (cb: () => void) => {
  window.addEventListener(SIGNED_OUT_EVENT, cb);
  return () => window.removeEventListener(SIGNED_OUT_EVENT, cb);
};

const emitSignedOut = () => window.dispatchEvent(new CustomEvent(SIGNED_OUT_EVENT));

/**
 * fetch() with the Authorization header. `keepSessionOn401` is for calls where 401 means
 * "wrong password" rather than "signed out" (login, password change).
 */
export async function apiFetch(input: string, init: RequestInit = {}, opts: { keepSessionOn401?: boolean } = {}) {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(input, { ...init, headers });
  // Only the token that was actually rejected is dropped (a new sign-in may have happened meanwhile)
  if (res.status === 401 && !opts.keepSessionOn401 && token && getToken() === token) {
    clearToken();
    emitSignedOut();
  }
  return res;
}

/** Ends the session on the server (best effort) and locally */
export async function signOut() {
  try {
    await apiFetch(`${API}/auth/logout`, { method: 'POST' });
  } catch {
    // Server unreachable: the local sign-out still happens
  }
  clearToken();
  emitSignedOut();
}

/** Downloads the database copy as a JSON file */
export async function downloadBackup() {
  const res = await apiFetch(`${API}/admin/backup`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] || `mobi_r-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
