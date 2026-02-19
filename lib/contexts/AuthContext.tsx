'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getToken, removeToken, type User } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  user: User | null;
  signOut: () => void;
  login: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: false,
  user: null,
  signOut: () => {},
  login: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        // Decode JWT payload to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        // We store minimal info - the name/email need to come from a /me endpoint
        // For now, extract what we can from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        } else {
          setUserData({ id: payload.id, name: 'User', email: '' });
        }
      } catch {
        removeToken();
      }
    }
    setIsLoaded(true);
  }, []);

  const signOut = () => {
    removeToken();
    localStorage.removeItem('user');
    setUserData(null);
    router.push('/');
  };

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUserData(user);
    router.push('/workspaces');
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn: !!userData,
        isLoaded,
        user: userData,
        signOut,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useUser() {
  return useContext(AuthContext);
}
