/**
 * Time Slot Booking Page - Simplified
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { type TimeSlot, type Court } from '@/utils/api';

interface PageProps {
    params: {
        id: string;
        courtId: string;
    };
}

export default function TimeSlotBookingPage({ params }: PageProps) {
    const router = useRouter();
    const [court, setCourt] = useState<Court | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const courtData = await api.getCourt(params.courtId);
                setCourt(courtData);
                const availability = await api.getAvailability(params.courtId, selectedDate);
                setSlots(availability);
            } catch (error) {
                console.error('Failed to load data:', error);
                // Mock data for testing
                generateMockSlots();
            }
        }

        fetchData();
    }, [params.courtId, selectedDate]);

    function generateMockSlots() {
        const mockSlots: TimeSlot[] = [];
        for (let hour = 6; hour < 22; hour++) {
            mockSlots.push({
                start_time: `2024-12-06T${hour.toString().padStart(2, '0')}:00:00`,
                end_time: `2024-12-06T${hour.toString().padStart(2, '0')}:30:00`,
                price: hour >= 17 ? 300 : 200,
                is_available: Math.random() > 0.3,
                is_peak: hour >= 17,
                status: Math.random() > 0.3 ? 'AVAILABLE' : 'BOOKED',
            });
        }
        setSlots(mockSlots);
        setCourt({ id: params.courtId, name: 'Court A', venue_id: params.id, description: '', min_booking_minutes: 30, max_booking_minutes: 120, is_active: true });
    }

    const handleSlotClick = (slot: TimeSlot) => {
        if (!slot.is_available) return;
        const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
        if (isSelected) {
            setSelectedSlots(selectedSlots.filter(s => s.start_time !== slot.start_time));
        } else {
            setSelectedSlots([...selectedSlots, slot]);
        }
    };

    const getTotalPrice = () => selectedSlots.reduce((sum, slot) => sum + slot.price, 0);

    const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    return (
        <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', paddingBottom: '120px' }}>
            <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '1rem 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                    <button onClick={() => router.back()} style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563EB',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        marginBottom: '0.5rem',
                    }}>
                        ← Back
                    </button>
                    <h2>{court?.name || 'Court'}</h2>
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Date Selector */}
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', marginBottom: '2rem' }}>
                    {dates.map((date, i) => {
                        const dateStr = formatDateForAPI(date);
                        const isSelected = dateStr === selectedDate;
                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(dateStr)}
                                style={{
                                    minWidth: '120px',
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: isSelected ? '#2563EB' : 'white',
                                    color: isSelected ? 'white' : '#374151',
                                    border: isSelected ? 'none' : '2px solid #E5E7EB',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDateShort(date)}
                            </button>
                        );
                    })}
                </div>

                {/* Time Slots */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '1rem',
                }}>
                    {slots.map((slot, idx) => {
                        const isSelected = selectedSlots.some(s => s.start_time === slot.start_time);
                        const isBooked = !slot.is_available;

                        return (
                            <button
                                key={idx}
                                onClick={() => handleSlotClick(slot)}
                                disabled={isBooked}
                                style={{
                                    height: '90px',
                                    border: `2px solid ${isSelected ? '#2563EB' : isBooked ? '#FCA5A5' : slot.is_peak ? '#FCD34D' : '#86EFAC'}`,
                                    borderRadius: '8px',
                                    backgroundColor: isSelected ? '#2563EB' : isBooked ? '#FEE2E2' : slot.is_peak ? '#FEF3C7' : '#DCFCE7',
                                    color: isSelected ? 'white' : isBooked ? '#EF4444' : slot.is_peak ? '#92400E' : '#166534',
                                    cursor: isBooked ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    fontWeight: 500,
                                }}
                            >
                                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                    {formatTime(slot.start_time)}
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>₹{slot.price}</div>
                                <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase' }}>
                                    {isBooked ? 'BOOKED' : 'BOOK'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Summary Bar */}
            {selectedSlots.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderTop: '2px solid #2563EB',
                    padding: '1rem',
                    boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)',
                }}>
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                    }}>
                        <div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                Selected: {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563EB' }}>
                                Total: ₹{getTotalPrice()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setSelectedSlots([])}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    border: '2px solid #E5E7EB',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => router.push(`/book/confirm?court=${params.courtId}&price=${getTotalPrice()}`)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#2563EB',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                }}
                            >
                                Proceed to Book →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getTodayDate(): string {
    return formatDateForAPI(new Date());
}

function formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
}

function formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
