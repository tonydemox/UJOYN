import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { setAccessToken } from './tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function restoreSession() {
            try {
                const { data } = await axiosInstance.post('/auth/refresh');
                setAccessToken(data.accessToken);
                const profile = await axiosInstance.get('/auth/me');
                setUser(profile.data);
            } catch {
                setAccessToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }
        restoreSession();
    }, []);

    async function login(email, password) {
        const { data } = await axiosInstance.post('/auth/login', { email, password });
        setAccessToken(data.accessToken);
        setUser(data.user);
    }

    async function register(formData) {
        const { data } = await axiosInstance.post('/auth/register', formData);
        setAccessToken(data.accessToken);
        setUser(data.user);
    }

    async function logout() {
        await axiosInstance.post('/auth/logout');
        setAccessToken(null);
        setUser(null);
    }

    async function refreshUser() {
        const { data } = await axiosInstance.get('/auth/me');
        setUser(data);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}