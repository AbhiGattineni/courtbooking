import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/public/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function BookingPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="max-w-3xl mx-auto">
                    <Card className="p-8 shadow-lg">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Confirm Booking</h1>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                            <h2 className="text-xl font-semibold text-blue-800 mb-2">Court ID: {id}</h2>
                            <p className="text-blue-600">
                                You are about to book this court. Please review the details below.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Date</span>
                                <span className="font-medium text-gray-900">Today</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Time Slot</span>
                                <span className="font-medium text-gray-900">06:00 PM - 07:00 PM</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-600">Price</span>
                                <span className="font-medium text-gray-900">₹800.00</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={() => alert('Booking functionality coming soon!')}
                                className="flex-1"
                            >
                                Confirm & Pay
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/courts')}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
