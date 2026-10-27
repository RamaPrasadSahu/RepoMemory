import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for unauthorized events dispatched by apiClient
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('repomemory:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('repomemory:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.login({ email, password });
      const loggedInUser = res.user || res.data?.user || res;
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authService.register({ name, email, password });
      const newUser = res.user || res.data?.user || res;
      setUser(newUser);
      return newUser;
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const loginAsDemo = async () => {
    return login('developer@example.com', 'demo-developer-mode');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    loginAsDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
