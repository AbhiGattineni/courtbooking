/**
 * Venues Grid - Simplified
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api, { type Venue } from '@/utils/api';

export default function VenuesGrid() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVenues() {
            try {
                const data = await api.getVenues();
                setVenues(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load venues');
            } finally {
                setLoading(false);
            }
        }

        fetchVenues();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading venues...</div>;
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#EF4444' }}>
                <p>{error}</p>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>
                    Make sure the backend API is running at http://localhost:8000
                </p>
            </div>
        );
    }

    if (venues.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ fontSize: '1.25rem', color: '#6B7280' }}>No venues available yet</p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
        }}>
            {venues.map((venue) => (
                <div
                    key={venue.id}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        transition: 'all 0.2s',
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '200px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: '4rem', opacity: 0.3 }}>🏏</span>
                    </div>

                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
                        {venue.name}
                    </h4>

                    <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        📍 {venue.city || 'Location'}{venue.pincode ? `, ${venue.pincode}` : ''}
                    </div>

                    <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                        ⭐⭐⭐⭐⭐ <span style={{ color: '#9CA3AF' }}>(125)</span>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#2563EB', marginBottom: '1rem' }}>
                        From ₹200/hour
                    </div>

                    <Link href={`/venues/${venue.id}`} style={{ textDecoration: 'none' }}>
                        <button style={{
                            width: '100%',
                            backgroundColor: '#2563EB',
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}>
                            View Details
                        </button>
                    </Link>
                </div>
            ))}
        </div>
    );
}
