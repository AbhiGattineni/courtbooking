import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaCreditCard, FaLock, FaCalendarAlt, FaClock } from 'react-icons/fa';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function PaymentPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const bookingDetails = location.state;

    const [showExitModal, setShowExitModal] = React.useState(false);

    // Block browser navigation/refresh
    React.useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Redirect if no data
    if (!bookingDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">No Booking Found</h2>
                    <Button onClick={() => navigate('/courts')}>Go to Courts</Button>
                </div>
            </div>
        );
    }

    const { court, slots, date, totalAmount } = bookingDetails;

    // NOTE: React Router v6 doesn't have usePrompt. We'd use unstable_useBlocker if available, 
    // but for now we'll rely on browser beforeunload for refreshing/closing tab.
    // For in-app navigation, we should use a custom Back button that warns.

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Info Alert */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r shadow-sm flex items-start">
                <div className="text-blue-500 text-xl mr-3 mt-0.5">ℹ️</div>
                <div>
                    <p className="font-bold text-blue-900">Did you know?</p>
                    <p className="text-blue-700 text-sm">
                        You can resume this payment anytime from <span className="font-bold">My Profile &gt; My Bookings</span>.
                        Don't worry if you close this page!
                    </p>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-blue-600 pl-4">Confirm & Pay</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Summary Section */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 border border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                            <span className="text-blue-600 mr-2">1.</span> Booking Summary
                        </h3>

                        <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Court</span>
                                <span className="font-bold text-gray-900">{court.name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Location</span>
                                <span className="text-gray-900 text-sm italic">{court.location}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">Date</span>
                                <span className="font-bold text-gray-900 flex items-center"><FaCalendarAlt className="mr-1 text-gray-400" /> {date}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-gray-500 text-sm">Slots</span>
                                <div className="text-right">
                                    {slots.map(s => (
                                        <span key={s} className="inline-block bg-white border border-gray-200 text-xs px-2 py-1 rounded ml-1 mb-1 font-mono text-blue-600 font-bold">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-lg font-bold text-gray-700">Total Payable</span>
                            <span className="text-3xl font-extrabold text-blue-600">₹{totalAmount}</span>
                        </div>
                    </Card>

                    <Card className="p-6 border border-gray-100 opacity-75 grayscale hover:grayscale-0 transition-all cursor-pointer">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center">
                            <span className="text-gray-400 mr-2">2.</span> Payment Method
                        </h3>
                        <div className="flex items-center gap-3 text-gray-500">
                            <FaLock />
                            <p>Secure Payment Gateway (Coming Soon)</p>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <Card className="p-6 bg-blue-600 text-white text-center">
                        <FaCreditCard className="text-4xl mx-auto mb-4 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Simulate Payment</h3>
                        <p className="text-sm text-blue-100 mb-6">Click below to complete the booking mock flow.</p>

                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full bg-white text-blue-600 font-bold py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
                        >
                            Pay ₹{totalAmount}
                        </button>
                    </Card>

                    <p className="text-xs text-center text-gray-500">
                        <FaLock className="inline mr-1" />
                        Payments are secure and encrypted.
                    </p>
                </div>
            </div>
        </div>
    );
}
