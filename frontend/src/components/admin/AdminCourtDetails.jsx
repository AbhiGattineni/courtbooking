import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DateStrip from '../public/DateStrip';
import { FaCalendarAlt, FaClock, FaUser, FaTimes } from 'react-icons/fa';

export default function AdminCourtDetails({ court, onClose }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [summary, setSummary] = useState({ total: 0, revenue: 0 });

    // Constants for slots (06:00 to 22:00)
    const allSlots = [];
    for (let h = 6; h < 22; h++) {
        allSlots.push(`${h}:00`);
        allSlots.push(`${h}:30`);
    }

    useEffect(() => {
        if (!court || !selectedDate) return;

        const dateStr = selectedDate.toLocaleDateString('en-CA');
        const q = query(
            collection(db, 'bookings'),
            where('courtId', '==', court.id),
            where('date', '==', dateStr)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBookings(bookingData);

            // Calculate summary
            const activeBookings = bookingData.filter(b => b.status !== 'cancelled'); // Simple filter
            setSummary({
                total: activeBookings.length,
                revenue: activeBookings.reduce((sum, b) => sum + (b.price || 0), 0)
            });
        });

        return () => unsubscribe();
    }, [court, selectedDate]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{court.name}</h2>
                        <p className="text-gray-500">{court.location} • {court.sportType}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <FaTimes className="text-xl text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-600 font-bold uppercase">Bookings Today</p>
                            <p className="text-3xl font-bold text-blue-900">{summary.total}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <p className="text-sm text-green-600 font-bold uppercase">Est. Revenue</p>
                            <p className="text-3xl font-bold text-green-900">₹{summary.revenue}</p>
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <FaCalendarAlt className="mr-2 text-blue-500" /> Select Date
                        </h3>
                        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
                    </div>

                    {/* Slots Grid */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                            <FaClock className="mr-2 text-blue-500" /> Schedule
                        </h3>

                        <div className="grid grid-cols-1 gap-3">
                            {allSlots.map(slot => {
                                // Find booking for this slot
                                const booking = bookings.find(b => b.timeSlot === slot && b.status !== 'cancelled');

                                // Format time
                                const [h, m] = slot.split(':');
                                const hour = parseInt(h);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const displayTime = `${hour > 12 ? hour - 12 : hour}:${m} ${ampm}`;

                                return (
                                    <div
                                        key={slot}
                                        className={`
                                            flex items-center justify-between p-4 rounded-xl border transition-all
                                            ${booking
                                                ? 'bg-red-50 border-red-100'
                                                : 'bg-white border-gray-100 hover:border-gray-200'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono font-bold text-gray-500 w-20">{displayTime}</span>
                                            {booking ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{booking.userName}</p>
                                                        <p className="text-xs text-gray-500 uppercase">{booking.status}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="text-sm font-medium text-gray-500">Available</span>
                                                </div>
                                            )}
                                        </div>

                                        {booking && (
                                            <div className="text-right">
                                                <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded">
                                                    ID: {booking.id.slice(0, 4)}...
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
