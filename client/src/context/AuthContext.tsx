import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (params: { email: string; password: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lsm_token'));
  const [loading, setLoading] = useState<boolean>(!!token);

  const fetchCurrentUser = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiClient.get<{ user: User }>('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('lsm_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/api/auth/login', {
        email,
        password,
      });
      localStorage.setItem('lsm_token', response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lsm_token');
  };

  const refreshUser = async () => fetchCurrentUser();

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

