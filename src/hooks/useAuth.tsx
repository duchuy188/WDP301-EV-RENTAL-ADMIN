import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService from '../components/service/authService';
import { LoginRequest, User } from '../components/service/type/authTypes';
import { showToast } from '../lib/toast';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authenticated = AuthService.isAuthenticated();
        const currentUser = AuthService.getCurrentUser();
        
        setIsAuthenticated(authenticated);
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      
      // Call AuthService login API
      const response = await AuthService.login(credentials);
      
      
      // Update authentication state
      setIsAuthenticated(true);
      setUser(response.user);
      setError(null);
      
      
    } catch (error: any) {
      console.error('❌ useAuth: Login failed:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      showToast.error(errorMessage);
      
      // Re-throw to allow UI to handle the error
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call AuthService logout API
      await AuthService.logout();
      
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Always clear local state even if API call fails
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      loading, 
      error 
    }}>
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
