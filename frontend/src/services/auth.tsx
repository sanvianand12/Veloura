import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User { id: number; name: string; email: string }
interface AuthValue { user: User | null; loading: boolean; refresh: () => Promise<User | null>; csrf: () => Promise<string>; logout: () => Promise<void> }
const AuthContext = createContext<AuthValue | null>(null);
const base = import.meta.env.VITE_API_BASE_URL || '';
export async function getCsrf(): Promise<string> {
  const res = await fetch(`${base}/api/auth/csrf`, { credentials: 'include' });
  const data = await res.json(); return data.csrf_token;
}
export async function authRequest<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const csrf = await getCsrf();
  const res = await fetch(`${base}/api/auth/${path}`, { method, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.detail || 'Request failed'); }
  return res.json();
}
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  const refresh = async () => { try { const res = await fetch(`${base}/api/auth/me`, { credentials: 'include' }); const next = res.ok ? await res.json() : null; setUser(next); return next; } catch { setUser(null); return null; } };
  const csrf = getCsrf;
  const logout = async () => { await authRequest('logout'); setUser(null); };
  useEffect(() => { void refresh().finally(() => setLoading(false)); }, []);
  return <AuthContext.Provider value={{ user, loading, refresh, csrf, logout }}>{children}</AuthContext.Provider>;
};
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider missing'); return value; }
export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, loading } = useAuth(); const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate('/sign-in', { replace: true }); }, [loading, user, navigate]);
  if (loading || !user) return <div className="min-h-screen bg-ivory-50" />;
  return <>{children}</>;
};
