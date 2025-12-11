import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { FaUsers, FaFutbol, FaCalendarCheck, FaMoneyBillWave } from 'react-icons/fa';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        courts: 0,
        bookings: 0,
        revenue: 0 // Mock revenue if price data is messy
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Realtime Listeners
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
            setStats(prev => ({ ...prev, users: snap.size }));
        });

        const unsubCourts = onSnapshot(collection(db, 'courts'), (snap) => {
            setStats(prev => ({ ...prev, courts: snap.size }));
        });

        const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
            let totalRevenue = 0;
            snap.forEach(doc => {
                const data = doc.data();
                if (data.price) totalRevenue += Number(data.price);
            });
            setStats(prev => ({ ...prev, bookings: snap.size, revenue: totalRevenue }));
            setLoading(false);
        });

        return () => {
            unsubUsers();
            unsubCourts();
            unsubBookings();
        };
    }, []);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className={`p-4 rounded-full ${color} bg-opacity-10 mr-4`}>
                <Icon className={`text-2xl ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</h3>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.users}
                    icon={FaUsers}
                    color="bg-blue-600"
                />
                <StatCard
                    title="Total Courts"
                    value={stats.courts}
                    icon={FaFutbol}
                    color="bg-green-600"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.bookings}
                    icon={FaCalendarCheck}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={FaMoneyBillWave}
                    color="bg-yellow-600"
                />
            </div>
        </div>
    );
}
