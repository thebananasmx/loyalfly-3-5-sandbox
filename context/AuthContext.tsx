import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  loginWithEmail,
  logout as firebaseLogout,
  registerBusiness as firebaseRegister,
  onAuthUserChanged,
  isSuperAdmin as firebaseIsSuperAdmin,
} from '../services/firebaseService';

interface User {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (authUser: any) => {
      if (authUser) {
        setUser({ uid: authUser.uid, email: authUser.email });
        const isAdmin = await firebaseIsSuperAdmin(authUser.uid);
        setIsSuperAdmin(isAdmin);
      } else {
        setUser(null);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await loginWithEmail(email, pass);
  };
  
  const register = async (email: string, pass: string, name: string) => {
    await firebaseRegister(email, pass, name);
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const value = { user, loading, isSuperAdmin, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};