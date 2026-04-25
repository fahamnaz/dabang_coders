import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api/client';

interface User {
  _id: string;
  email: string;
  childName: string;
  avatarEmoji: string;
  age: number | null;
  ageBand: string | null;
  preferredModality: string | null;
  interests: string[];
  learningGoals: string[];
  confidence: number;
  totalStars: number;
  totalPlayTimeMinutes: number;
  badges: Array<{ id: string; emoji: string; name: string; earnedAt: string }>;
  streakDays: number;
  onboarded: boolean;
  lastActiveAt: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, childName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    age?: number;
    interests?: string[];
    learningGoals?: string[];
    avatarEmoji?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = window.localStorage.getItem('playspark-token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.get<{ user: User }>('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {
        // Token invalid, clear it
        window.localStorage.removeItem('playspark-token');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await api.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });
    window.localStorage.setItem('playspark-token', token);
    setUser(user);
  }, []);

  const signup = useCallback(async (email: string, password: string, childName: string) => {
    const { user, token } = await api.post<{ user: User; token: string }>('/auth/signup', {
      email,
      password,
      childName,
    });
    window.localStorage.setItem('playspark-token', token);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    window.localStorage.removeItem('playspark-token');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: {
    age?: number;
    interests?: string[];
    learningGoals?: string[];
    avatarEmoji?: string;
  }) => {
    const { user: updatedUser } = await api.put<{ user: User }>('/auth/profile', data);
    setUser(updatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: updatedUser } = await api.get<{ user: User }>('/auth/me');
      setUser(updatedUser);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      signup,
      logout,
      updateProfile,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
