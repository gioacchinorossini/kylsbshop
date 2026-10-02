'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  userId: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, userRole: string, name: string) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, [pathname]);

  // Handle route protection
  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === '/login';

    if (!user) {
      if (!isLoginPage) {
        router.replace('/login');
      }
    } else {
      if (isLoginPage || pathname === '/') {
        // Redirect based on role
        if (user.role === 'Admin') {
          router.replace('/masterlist');
        } else if (user.role === 'Cashier') {
          router.replace('/order');
        } else if (user.role === 'Manager') {
          router.replace('/reports');
        } else {
          router.replace('/login?error=unknown_role');
        }
      } else {
        // Specific role routing protections
        if (user.role === 'Cashier' && !['/order', '/kitchen', '/waiter'].includes(pathname)) {
          router.replace('/order');
        } else if (user.role === 'Manager' && !['/reports', '/transactions', '/stockin', '/kitchen', '/waiter'].includes(pathname)) {
          router.replace('/reports');
        }
      }
    }
  }, [user, pathname, loading, router]);

  const login = (username: string, userRole: string, name: string) => {
    const loggedInUser = { userId: username, role: userRole, name };
    setUser(loggedInUser);
    
    // Redirect based on role
    if (userRole === 'Admin') {
      router.push('/masterlist');
    } else if (userRole === 'Cashier') {
      router.push('/order');
    } else if (userRole === 'Manager') {
      router.push('/reports');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
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
