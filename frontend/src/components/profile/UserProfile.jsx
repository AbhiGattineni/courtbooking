import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Button from '../common/Button';
import { FaUser, FaPhone, FaSave } from 'react-icons/fa';

export default function UserProfile({ userData, setUserData }) {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: userData?.displayName || '',
        phone: userData?.phone || ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                phone: formData.phone
            });

            // Update local state
            setUserData(prev => ({
                ...prev,
                displayName: formData.displayName,
                phone: formData.phone
            }));

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                {!isEditing && (
                    <Button
                        variant="secondary"
                        onClick={() => setIsEditing(true)}
                        className="text-sm"
                    >
                        Edit Profile
                    </Button>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={currentUser?.email || ''}
                            disabled
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="displayName"
                                value={isEditing ? formData.displayName : (userData?.displayName || '')}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                                placeholder="Enter your name"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaPhone className="text-gray-400" />
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                value={isEditing ? formData.phone : (userData?.phone || '')}
                                onChange={handleChange}
                                disabled={!isEditing}
                                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEditing ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center"
                            >
                                <FaSave className="mr-2" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        displayName: userData?.displayName || '',
                                        phone: userData?.phone || ''
                                    });
                                    setMessage('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
