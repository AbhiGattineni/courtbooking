/**
 * Booking Success Page - Simplified
 * Displays confirmation after successful booking
 */
'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function BookingSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('booking') || 'BK-XXXXXX';
    const [copied, setCopied] = useState(false);

    const handleCopyReference = () => {
        navigator.clipboard.writeText(bookingId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadInvoice = () => {
        alert('Invoice download feature - connect to backend API');
    };

    return (
        <div style={{
            backgroundColor: '#F9FAFB',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 1rem',
        }}>
            <div style={{ maxWidth: '600px', width: '100%' }}>
                {/* Success Animation */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        fontSize: '6rem',
                        color: '#10B981',
                        marginBottom: '1.5rem',
                    }}>
                        ✅
                    </div>
                    <h1 style={{ color: '#10B981', marginBottom: '0.75rem' }}>
                        Booking Confirmed! 🎉
                    </h1>
                    <p style={{ fontSize: '1.125rem', color: '#6B7280' }}>Your court is reserved</p>
                </div>

                {/* Booking Reference */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                }}>
                    <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>
                        Booking Reference
                    </p>
                    <div style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        marginBottom: '1rem',
                        color: '#111827',
                    }}>
                        {bookingId.slice(0, 12)}
                    </div>
                    <button
                        onClick={handleCopyReference}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>

                {/* Booking Details */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📅</span>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Date</p>
                                <p style={{ fontWeight: 500 }}>{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>⏰</span>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Time</p>
                                <p style={{ fontWeight: 500 }}>18:00 - 19:30</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>💰</span>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Amount Paid</p>
                                <p style={{ fontWeight: 500 }}>₹590</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                }}>
                    <button
                        onClick={handleDownloadInvoice}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            backgroundColor: '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        📥 Download Invoice
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.75rem',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '2px solid #E5E7EB',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        View Details
                    </button>
                </div>

                {/* What's Next */}
                <div style={{
                    backgroundColor: '#EFF6FF',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span>ℹ️</span>
                        <div>
                            <h4 style={{ marginBottom: '0.75rem' }}>What's Next?</h4>
                            <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                <li style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    You'll receive a confirmation email shortly
                                </li>
                                <li style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Show your booking reference at the venue
                                </li>
                                <li style={{ fontSize: '0.875rem' }}>
                                    Arrive 10 minutes early
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <button
                    onClick={() => router.push('/')}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: 'white',
                        color: '#374151',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    🏏 Book Another Court
                </button>
            </div>
        </div>
    );
}
