/**
 * Venue Detail Page - Simplified
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { type Venue, type Court } from '@/utils/api';

interface PageProps {
    params: {
        id: string;
    };
}

export default function VenueDetailPage({ params }: PageProps) {
    const router = useRouter();
    const [venue, setVenue] = useState<Venue | null>(null);
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const venues = await api.getVenues();
                const foundVenue = venues.find(v => v.id === params.id);
                if (foundVenue) {
                    setVenue(foundVenue);
                    const courtsData = await api.getCourts(params.id);
                    setCourts(courtsData);
                }
            } catch (error) {
                console.error('Failed to load venue:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id]);

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
    }

    if (!venue) {
        return <div style={{ padding: '3rem', textAlign: 'center' }}>Venue not found</div>;
    }

    return (
        <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
                {/* Venue Info */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                }}>
                    <div style={{
                        width: '100%',
                        height: '400px',
                        backgroundColor: '#F3F4F6',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <span style={{ fontSize: '6rem', opacity: 0.3 }}>🏟️</span>
                    </div>

                    <h2 style={{ marginBottom: '1rem' }}>{venue.name}</h2>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {venue.city && (
                            <span style={{
                                backgroundColor: '#F 3F4F6',
                                padding: '0.5rem 1rem',
                                borderRadius: '9999px',
                                fontSize: '0.875rem',
                            }}>
                                📍 {venue.city}{venue.pincode ? `, ${venue.pincode}` : ''}
                            </span>
                        )}
                        <span style={{
                            backgroundColor: '#F3F4F6',
                            padding: '0.5rem 1rem',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                        }}>
                            ⏰ Open 6 AM - 11 PM
                        </span>
                    </div>

                    <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>About This Venue</h3>
                    <p style={{ color: '#6B7280', lineHeight: 1.6 }}>
                        Premium box cricket facility. Located in {venue.city || 'prime location'}.
                    </p>

                    <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Amenities</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '0.5rem',
                    }}>
                        {['Parking', 'Changing Rooms', 'Drinking Water', 'Equipment'].map(amenity => (
                            <div key={amenity} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ color: '#10B981' }}>✓</span>
                                <span>{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Courts List */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Courts Available</h3>

                    {courts.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#6B7280' }}>No courts available</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {courts.map((court) => (
                                <div
                                    key={court.id}
                                    style={{
                                        padding: '1.5rem',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        flexWrap: 'wrap',
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <h4>{court.name}</h4>
                                            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.5rem' }}>
                                                {court.description || 'Professional cricket court'}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                                                Min: {court.min_booking_minutes} mins | Max: {court.max_booking_minutes} mins
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => router.push(`/venues/${params.id}/courts/${court.id}/book`)}
                                            style={{
                                                backgroundColor: '#2563EB',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Check Availability
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
