/**
 * Booking Confirmation Page - Simplified
 * Shows booking summary and payment options
 */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BookingConfirmationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('upi');

    const courtId = searchParams.get('court') || '';
    const price = parseFloat(searchParams.get('price') || '500');

    const tax = Math.round(price * 0.18);
    const total = price + tax;

    const handleProceedToPayment = async () => {
        if (!agreedToTerms) {
            alert('Please agree to the terms and conditions');
            return;
        }

        setLoading(true);
        // Simulate booking
        setTimeout(() => {
            router.push(`/book/success?booking=${courtId}-${Date.now()}`);
        }, 1500);
    };

    return (
        <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
            {/* Progress Indicator */}
            <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#10B981',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                            }}>
                                ✓
                            </div>
                            <span style={{ fontSize: '0.875rem' }}>Select Slots</span>
                        </div>
                        <div style={{ width: '40px', height: '2px', backgroundColor: '#2563EB' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#2563EB',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                            }}>
                                2
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Review & Pay</span>
                        </div>
                        <div style={{ width: '40px', height: '2px', backgroundColor: '#E5E7EB' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#F3F4F6',
                                color: '#9CA3AF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                            }}>
                                3
                            </div>
                            <span style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Confirmation</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem',
                }}
                    className="booking-grid">
                    {/* Left Column - Details */}
                    <div>
                        {/* Booking Details */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '1.5rem',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Booking Details</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #E5E7EB' }}>
                                    <span style={{ color: '#6B7280' }}>Date:</span>
                                    <span style={{ fontWeight: 500 }}>{new Date().toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #E5E7EB' }}>
                                    <span style={{ color: '#6B7280' }}>Time:</span>
                                    <span style={{ fontWeight: 500 }}>18:00 - 19:30</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6B7280' }}>Duration:</span>
                                    <span style={{ fontWeight: 500 }}>90 minutes</span>
                                </div>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Price Breakdown</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Subtotal:</span>
                                    <span>₹{price}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Tax (18%):</span>
                                    <span>₹{tax}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: '1rem',
                                    borderTop: '2px solid #E5E7EB',
                                    fontWeight: 700,
                                    fontSize: '1.25rem',
                                    color: '#2563EB',
                                }}>
                                    <span>Total:</span>
                                    <span>₹{total}</span>
                                </div>
                            </div>
                        </div>

                        {/* Policy */}
                        <div style={{
                            backgroundColor: '#FEF3C7',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginTop: '1.5rem',
                        }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <span>ℹ️</span>
                                <div>
                                    <h4 style={{ marginBottom: '0.5rem' }}>Cancellation Policy</h4>
                                    <p style={{ fontSize: '0.875rem' }}>
                                        Cancellations not allowed after payment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        height: 'fit-content',
                    }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Payment Details</h3>

                        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#2563EB', marginBottom: '0.5rem' }}>
                            ₹{total}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '2rem' }}>
                            Including all taxes
                        </p>

                        {/* Payment Methods */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem' }}>Payment Method</h4>

                            {['upi', 'card', 'netbanking', 'venue'].map((method) => (
                                <div
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    style={{
                                        padding: '1rem',
                                        border: `2px solid ${paymentMethod === method ? '#2563EB' : '#E5E7EB'}`,
                                        borderRadius: '8px',
                                        marginBottom: '0.75rem',
                                        cursor: 'pointer',
                                        backgroundColor: paymentMethod === method ? '#EFF6FF' : 'white',
                                    }}
                                >
                                    {method === 'upi' && '📱 UPI'}
                                    {method === 'card' && '💳 Credit/Debit Card'}
                                    {method === 'netbanking' && '🏦 Net Banking'}
                                    {method === 'venue' && '💰 Pay at Venue'}
                                </div>
                            ))}
                        </div>

                        {/* Terms */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span style={{ fontSize: '0.875rem' }}>
                                    I agree to the <a href="#" style={{ color: '#2563EB' }}>Terms and Conditions</a>
                                </span>
                            </label>
                        </div>

                        {/* Proceed Button */}
                        <button
                            onClick={handleProceedToPayment}
                            disabled={!agreedToTerms || loading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                backgroundColor: agreedToTerms ? '#2563EB' : '#9CA3AF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: agreedToTerms ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {loading ? 'Processing...' : 'Proceed to Payment'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                🔒 Secure payment powered by Razorpay
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @media (max-width: 768px) {
          .booking-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
