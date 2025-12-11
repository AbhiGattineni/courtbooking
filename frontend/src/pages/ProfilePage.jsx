import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, getDoc, query, collection, where, onSnapshot } from "firebase/firestore";
import { FaUser, FaHistory, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import UserProfile from "../components/profile/UserProfile";
import UserBookings from "../components/profile/UserBookings";

export default function ProfilePage() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [userData, setUserData] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

    const [activeBookings, setActiveBookings] = useState([]); // Deprecated
    const [pendingBookings, setPendingBookings] = useState([]);
    const [historyBookings, setHistoryBookings] = useState([]);

    useEffect(() => {
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

    // Fetch User Bookings (Active Confirmed + Pending Reserved)
    useEffect(() => {
        if (!currentUser) return;

        // Note: For complex filtering (OR condition with dates), client-side filtering is often easier with Firestore
        // unless we create a composite index. We'll fetch user's bookings and filter.
        const q = query(
            collection(db, 'bookings'),
            where('userId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const now = new Date();

            const filtered = bookingsList.filter(booking => {
                if (booking.status === 'confirmed') return true;
                if (booking.status === 'reserved') {
                    // Check 5 min expiry
                    if (!booking.createdAt) return false;
                    const created = booking.createdAt.toDate();
                    const diffMins = (now - created) / 1000 / 60;
                    return diffMins <= 5;
                }
                return false;
            });

            // Sort by date (newest first)
            filtered.sort((a, b) => {
                // Assuming date is stored as string YYYY-MM-DD. For better sort use timestamp if avail or parse
                // But we also have createdAt
                return b.createdAt - a.createdAt;
            });

            const pending = filtered.filter(b => b.status === 'reserved');
            const history = filtered.filter(b => b.status !== 'reserved');

            setPendingBookings(pending);
            setHistoryBookings(history);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <UserProfile userData={userData} setUserData={setUserData} />;
            case 'bookings':
                return <UserBookings history={historyBookings} pending={pendingBookings} />;
            default:
                return <UserProfile userData={userData} setUserData={setUserData} />;
        }
    };

    const NavItem = ({ id, icon: Icon, label, isDestructive = false }) => (
        <button
            onClick={() => {
                if (id === 'logout') {
                    handleLogout();
                } else {
                    setActiveTab(id);
                    setIsSidebarOpen(false);
                }
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === id && id !== 'logout'
                ? 'bg-blue-50 text-blue-600'
                : isDestructive
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                <FaUser />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 truncate max-w-[120px]">
                                    {userData?.displayName || 'User'}
                                </h3>
                                <p className="text-xs text-gray-500 truncate max-w-[120px]">
                                    {currentUser?.email}
                                </p>
                            </div>
                        </div>
                        <button
                            className="md:hidden text-gray-400"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <NavItem id="profile" icon={FaUser} label="My Profile" />
                        <NavItem id="bookings" icon={FaHistory} label="My Bookings" />
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <NavItem id="logout" icon={FaSignOutAlt} label="Log Out" isDestructive />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-auto">
                {/* Mobile Header for Sidebar Toggle */}
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-600 focus:outline-none"
                    >
                        <FaBars size={24} />
                    </button>
                    <span className="ml-4 font-bold text-gray-900">
                        {activeTab === 'profile' ? 'My Profile' : 'My Bookings'}
                    </span>
                </div>

                <div className="p-4 md:p-8 max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
