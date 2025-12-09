import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "./common/Card";
import Button from "./common/Button";
import { db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
                        Welcome, {userData?.displayName || "User"}
                    </h2>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-3 mb-4 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="text-gray-700 mb-6 space-y-2">
                        <p><strong>Email:</strong> {currentUser?.email}</p>
                        {userData && (
                            <>
                                <p><strong>Phone:</strong> {userData.phone}</p>
                                <p><strong>Role:</strong> {userData.role}</p>
                                <p className="text-sm text-gray-500 mt-4">
                                    Member since: {userData.createdAt?.toDate().toLocaleDateString()}
                                </p>
                            </>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        onClick={handleLogout}
                        className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                        Log Out
                    </Button>
                </Card>
            </div>
        </div>
    );
}
