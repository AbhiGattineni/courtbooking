import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaFutbol, FaSignOutAlt, FaHome } from 'react-icons/fa';

export default function AdminLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
            {/* Sidebar - Fixed width, full height */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-full border-r border-slate-700">
                <div className="p-6 border-b border-slate-700 flex-shrink-0">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="bg-blue-600 rounded px-2 py-1 text-sm">ADMIN</span>
                        <span>Panel</span>
                    </h1>
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

            {/* Main Content - Takes remaining width and scrolls independently */}
            <main className="flex-1 h-full overflow-y-auto bg-gray-50 relative">
                <div className="p-8 pb-20">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
