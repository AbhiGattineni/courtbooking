/**
 * Authentication Context
 * Google OAuth integration and user state management
 */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { endpoints } from '@/lib/api';

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name?: string;
    role: 'SUPER_ADMIN' | 'MANAGER' | 'USER';
    organization_id?: string;
    is_active: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (googleToken: string) => Promise<void>;
    logout: () => void;
    isSuperAdmin: boolean;
    isManager: boolean;
    isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('auth_token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    // Verify token by fetching current user
                    const response = await api.get(endpoints.me);
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }

            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (googleToken: string) => {
        try {
            const response = await api.post(endpoints.googleLogin, {
                google_token: googleToken,
            });

            const { access_token, user: userData } = response.data;

            // Save to localStorage
            localStorage.setItem('auth_token', access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/';
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isManager: user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN',
        isUser: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
