import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaHistory, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Button from '../common/Button';

export default function UserBookings({ history = [], pending = [] }) {
    const navigate = useNavigate();

    const handlePayNow = (booking) => {
        // Construct the expected payload for PaymentPage
        navigate('/payment', {
            state: {
                court: {
                    id: booking.courtId,
                    name: booking.courtName,
                    location: booking.location || 'Unknown Location',
                    pricePerSlot: booking.price
                },
                slots: Array.isArray(booking.timeSlot) ? booking.timeSlot : [booking.timeSlot],
                date: booking.date,
                totalAmount: booking.price
            }
        });
    };

    if ((!history || history.length === 0) && (!pending || pending.length === 0)) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCalendarAlt className="text-blue-500 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-500 mb-6">You haven't made any bookings yet. Start exploring our courts!</p>
                <Button onClick={() => navigate('/courts')}>
                    Book a Court
                </Button>
            </div>
        );
    }

    // Group pending bookings by Court + Date
    const groupedPending = pending.reduce((acc, booking) => {
        const key = `${booking.courtId}-${booking.date}`;
        if (!acc[key]) {
            acc[key] = {
                ...booking,
                slots: [booking.timeSlot],
                totalPrice: Number(booking.price),
                ids: [booking.id]
            };
        } else {
            acc[key].slots.push(booking.timeSlot);
            acc[key].totalPrice += Number(booking.price);
            acc[key].ids.push(booking.id);
        }
        return acc;
    }, {});

    const pendingGroups = Object.values(groupedPending);

    return (
        <div className="space-y-6">
            {/* Pending Payments Section */}
            {pendingGroups.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xl font-extrabold text-blue-600 flex items-center">
                        <FaClock className="mr-2" />
                        Complete Your Booking
                    </h2>
                    {pendingGroups.map((group) => (
                        <div key={group.ids[0]} className="bg-blue-50 rounded-xl border-2 border-blue-200 p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                ACTION REQUIRED
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{group.courtName}</h3>
                                    <div className="flex items-center gap-4 text-sm mt-1">
                                        <span className="flex items-center text-gray-700">
                                            <FaCalendarAlt className="mr-1 text-blue-500" /> {group.date}
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {group.slots.sort().map(slot => (
                                                <span key={slot} className="font-mono bg-white px-2 rounded border border-blue-100 text-blue-600 font-bold">
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-red-500 mt-2 font-bold animate-pulse">
                                        Expires in 5 minutes if unpaid.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => handlePayNow({
                                        courtId: group.courtId,
                                        courtName: group.courtName,
                                        location: group.location,
                                        price: group.totalPrice,
                                        timeSlot: group.slots, // Passing array here
                                        date: group.date
                                    })}
                                    className="bg-blue-600 hover:bg-blue-700 shadow-lg w-full md:w-auto px-8"
                                >
                                    Pay ₹{group.totalPrice} Now
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History Section */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FaHistory className="mr-2 text-gray-400" />
                    Booking History
                </h2>

                {history.length === 0 ? (
                    <p className="text-gray-400 italic">No past bookings.</p>
                ) : (
                    history.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{booking.courtName || "Unknown Court"}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <FaMapMarkerAlt className="mr-1 text-gray-400" />
                                        {booking.location || "Bangalore"}
                                    </div>
                                </div>

                                <div className="flex flex-col items-start md:items-end">
                                    <div className="flex items-center text-gray-700 font-medium">
                                        <FaCalendarAlt className="mr-2 text-blue-500" />
                                        {booking.date || "Date N/A"}
                                    </div>
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                        <FaClock className="mr-2 text-gray-400" />
                                        {booking.timeSlot || "Time N/A"}
                                    </div>
                                </div>

                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {booking.status ? booking.status.toUpperCase() : 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
