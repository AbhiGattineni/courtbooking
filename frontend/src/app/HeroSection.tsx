/**
 * Hero Section - Simplified
 */
'use client';

import { getOrganizationName } from '@/utils/organization';

export default function HeroSection() {
    const orgName = getOrganizationName();

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                padding: '3rem 0',
            }}
        >
            <div style={{ maxWidth: '1200px', width: '100%', padding: '0 1rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'white' }}>
                    Welcome to {orgName} Cricket Courts
                </h1>
                <p style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '2rem' }}>
                    Book your favorite cricket court in minutes
                </p>

                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '1rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                }}>
                    <input
                        type="text"
                        placeholder="Search venues..."
                        style={{
                            flex: 1,
                            border: 'none',
                            height: '48px',
                            padding: '0 1rem',
                            fontSize: '1rem',
                            borderRadius: '8px',
                        }}
                    />
                    <button style={{
                        backgroundColor: '#2563EB',
                        color: 'white',
                        border: 'none',
                        padding: '0 2rem',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        height: '48px',
                    }}>
                        Search 🔍
                    </button>
                </div>
            </div>
        </div>
    );
}
