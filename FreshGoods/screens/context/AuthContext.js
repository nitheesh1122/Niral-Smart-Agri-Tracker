import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

/**
 * AuthContext - Centralized authentication state management
 * Provides: user, loading, login, logout, isAuthenticated
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in on app start
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const [token, userId, role] = await AsyncStorage.multiGet([
                'token',
                'userId',
                'role',
            ]);

            if (token[1] && userId[1] && role[1]) {
                setUser({
                    id: userId[1],
                    role: role[1],
                    token: token[1],
                });
            }
        } catch (err) {
            console.warn('Auth state check failed:', err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Login user with credentials
     */
    const login = async (username, password, role) => {
        try {
            setLoading(true);
            setError(null);

            const { data } = await api.post('/api/login', {
                username,
                password,
                role,
            });

            if (!data.success) {
                throw new Error(data.message || 'Login failed');
            }

            // Store auth data
            await AsyncStorage.multiSet([
                ['token', data.token],
                ['userId', data.user._id],
                ['role', role],
            ]);

            setUser({
                id: data.user._id,
                role,
                token: data.token,
                ...data.user,
            });

            return { success: true, user: data.user };
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Login failed';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout user and clear stored data
     */
    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'userId', 'role']);
            setUser(null);
            setError(null);
            return { success: true };
        } catch (err) {
            console.error('Logout error:', err.message);
            return { success: false, message: err.message };
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth: checkAuthState,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
