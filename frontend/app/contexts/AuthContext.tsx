'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '@/app/lib/api-client';
import type { User } from '@/app/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const loadUser = async () => {
      const token = apiClient.getToken();
      if (token) {
        try {
          // Validate the token by fetching user data
          const response = await apiClient.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear it
            apiClient.setToken(null);
          }
        } catch (error) {
          // Error fetching user, clear token
          apiClient.setToken(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await apiClient.register(email, password, name);

      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }

      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  const logout = () => {
    apiClient.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
