import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProfilePage() {
    const [error, setError] = useState("");
    const [userData, setUserData] = useState(null);
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        async function fetchUserData() {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                }
            }
        }
        fetchUserData();
    }, [currentUser]);

    async function handleLogout() {
        setError("");

        try {
            await logout();
            navigate("/login");
        } catch {
            setError("Failed to log out");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex justify-center p-4 py-8">
            <div className="w-full max-w-4xl space-y-6">
                {/* Profile Section */}
                <Card className="p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
                        My Profile
                    </h2>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Personal Details</h3>
                            <div className="text-gray-700 space-y-3">
                                <p><strong>Name:</strong> {userData?.displayName || "N/A"}</p>
                                <p><strong>Email:</strong> {currentUser?.email}</p>
                                {userData && (
                                    <>
                                        <p><strong>Phone:</strong> {userData.phone || "N/A"}</p>
                                        <p><strong>Role:</strong> {userData.role || "User"}</p>
                                        <p className="text-sm text-gray-500 mt-4">
                                            Member since: {userData.createdAt?.toDate().toLocaleDateString() || "Recent"}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Account Actions</h3>
                                <p className="text-gray-600 mb-4">Manage your account settings and preferences.</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={handleLogout}
                                className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
                            >
                                Log Out
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Booking History Placeholder */}
                <Card className="p-8 shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking History</h2>
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-lg">No bookings found yet.</p>
                        <Button
                            className="mt-4"
                            onClick={() => navigate('/courts')}
                        >
                            Book a Court
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
