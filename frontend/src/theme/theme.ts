/**
 * Material-UI Theme Configuration
 * Premium design with vibrant colors and modern aesthetics
 */
'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color palette - Clean and Modern (Slate & Indigo)
const colors = {
    primary: {
        main: '#0f172a', // Slate 900 - Deep, professional dark
        light: '#334155', // Slate 700
        dark: '#020617', // Slate 950
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#4f46e5', // Indigo 600 - Vibrant accent
        light: '#818cf8',
        dark: '#3730a3',
        contrastText: '#ffffff',
    },
    accent: {
        main: '#0ea5e9', // Sky 500
        light: '#38bdf8',
        dark: '#0284c7',
    },
    error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
    },
    warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
    },
    success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
    },
    background: {
        default: '#f8fafc', // Slate 50
        paper: '#ffffff',
        dark: '#0f172a',
    },
    text: {
        primary: '#0f172a', // Slate 900
        secondary: '#64748b', // Slate 500
    },
};

// Theme configuration
const themeOptions: ThemeOptions = {
    palette: {
        mode: 'light',
        ...colors,
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
        h1: {
            fontSize: '3.5rem',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: colors.primary.main,
        },
        h2: {
            fontSize: '2.75rem',
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: colors.primary.main,
        },
        h3: {
            fontSize: '2.25rem',
            fontWeight: 700,
            lineHeight: 1.4,
            color: colors.primary.main,
        },
        h4: {
            fontSize: '1.875rem',
            fontWeight: 600,
            lineHeight: 1.4,
            color: colors.primary.main,
        },
        h5: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.5,
            color: colors.primary.main,
        },
        h6: {
            fontSize: '1.25rem',
            fontWeight: 600,
            lineHeight: 1.5,
            color: colors.primary.main,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
        },
    },
    shape: {
        borderRadius: 12,
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ],
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontSize: '0.9375rem',
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        transform: 'translateY(-1px)',
                        transition: 'all 0.2s ease-in-out',
                    },
                },
                contained: {
                    backgroundColor: colors.primary.main,
                    color: '#ffffff',
                    '&:hover': {
                        backgroundColor: colors.primary.light,
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)',
                    },
                },
                outlined: {
                    borderWidth: '2px',
                    '&:hover': {
                        borderWidth: '2px',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-4px)',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                },
            },
        },
    },
};

const theme = createTheme(themeOptions);

export default theme;
