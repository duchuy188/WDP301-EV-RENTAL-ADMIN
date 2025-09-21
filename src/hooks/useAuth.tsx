import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(storage.getAuth());

  useEffect(() => {
    setIsAuthenticated(storage.getAuth());
  }, []);

  const login = () => {
    storage.setAuth(true);
    setIsAuthenticated(true);
  };

  const logout = () => {
    storage.setAuth(false);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
