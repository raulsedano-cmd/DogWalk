import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is stored in localStorage
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const register = async (data) => {
        const response = await api.post('/auth/register', data);
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return response.data;
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return response.data;
    };

    const loginWithToken = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (userData) => {
        // Enforce persistence in both state and localStorage
        const updated = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
    };

    const switchRole = async (role) => {
        try {
            const response = await api.post('/users/switch-role', { role });
            const updatedUser = response.data.user;
            updateUser(updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Error switching role:', error);
            throw error;
        }
    };

    const activateRole = async (role) => {
        try {
            const response = await api.post('/users/activate-role', { role });
            const updatedUser = response.data.user;
            updateUser(updatedUser);
            return updatedUser;
        } catch (error) {
            console.error('Error activating role:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        register,
        login,
        loginWithToken,
        logout,
        updateUser,
        switchRole,
        activateRole,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
