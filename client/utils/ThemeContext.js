import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('themePreference');
                if (savedTheme !== null) {
                    setIsDarkMode(savedTheme === 'dark');
                }
            } catch (err) {
                console.error('Failed to load theme preference:', err);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem('themePreference', newMode ? 'dark' : 'light');
        } catch (err) {
            console.error('Failed to save theme preference:', err);
        }
    };

    const theme = {
        isDarkMode,
        colors: isDarkMode ? darkColors : lightColors,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

const lightColors = {
    primary: '#0099FF',
    secondary: '#00D4FF',
    accent: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    textLight: '#64748B',
    border: '#E2E8F0',
    glass: 'rgba(255, 255, 255, 0.8)',
};

const darkColors = {
    primary: '#3B82F6',
    secondary: '#60A5FA',
    accent: '#818CF8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    background: '#0F172A',
    cardBg: '#1E293B',
    text: '#F8FAFC',
    textLight: '#94A3B8',
    border: '#334155',
    glass: 'rgba(30, 41, 59, 0.8)',
};
