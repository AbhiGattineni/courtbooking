import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmationModal from '../common/ConfirmationModal';

export default function BookingManagement() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
            const bookingsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBookings(bookingsList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleCancelClick = (id) => {
        setConfirmModal({ isOpen: true, id });
    };

    const confirmCancel = async () => {
        if (!confirmModal.id) return;
        try {
            await deleteDoc(doc(db, 'bookings', confirmModal.id));
        } catch (error) {
            console.error("Error cancelling booking: ", error);
        }
        setConfirmModal({ isOpen: false, id: null });
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">All Bookings</h2>
            </div>

            {bookings.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <FaCalendarAlt className="mx-auto text-4xl mb-3 text-gray-300" />
                    <p>No active bookings found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Court</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Date/Time</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{booking.courtName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{booking.userId}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="font-bold text-gray-700">{booking.date}</div>
                                        <div className="text-blue-500 font-mono text-xs">{booking.timeSlot}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                            ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'reserved' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {booking.status || 'Confirmed'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleCancelClick(booking.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center px-3 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <FaTimes className="mr-1" /> Cancel
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmCancel}
                title="Cancel Booking?"
                message="Are you sure you want to cancel this booking? This action cannot be undone."
            />
        </div>
    );
}
