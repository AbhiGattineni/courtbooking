import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaFutbol, FaSignOutAlt, FaHome, FaBars, FaTimes } from 'react-icons/fa';

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false); // Mobile toggle

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/admin', icon: FaTachometerAlt, label: 'Dashboard' },
        { path: '/admin/users', icon: FaUsers, label: 'Users' },
        { path: '/admin/courts', icon: FaFutbol, label: 'Courts' },
        { path: '/admin/bookings', icon: FaCalendarAlt, label: 'Bookings' },
    ];

    return (
        <div className="h-screen bg-gray-100 flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-full border-r border-slate-700
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-700 flex-shrink-0 flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="bg-blue-600 rounded px-2 py-1 text-sm">ADMIN</span>
                        <span>Panel</span>
                    </h1>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                            onClick={() => setIsSidebarOpen(false)} // Close on navigate (mobile)
                        >
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700 space-y-2 flex-shrink-0">
                    <Link
                        to="/"
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                        <FaHome />
                        <span>Public Home</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-900/30 hover:text-red-200 transition-colors"
                    >
                        <FaSignOutAlt />
                        <span>Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto bg-gray-50 relative flex flex-col">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 mr-4">
                        <FaBars size={24} />
                    </button>
                    <span className="font-bold text-gray-800">Admin Panel</span>
                </div>

                <div className="p-4 md:p-8 pb-20 flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
