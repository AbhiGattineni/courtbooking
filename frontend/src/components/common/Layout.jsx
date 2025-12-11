import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../public/Navbar';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function Layout() {
    // Global Cleanup Service for Expired Reservations
    useEffect(() => {
        const cleanupExpiredReservations = async () => {
            try {
                const now = new Date();
                const q = query(collection(db, 'bookings'), where('status', '==', 'reserved'));
                const snapshot = await getDocs(q);

                const deletePromises = [];
                snapshot.forEach((document) => {
                    const data = document.data();
                    if (data.createdAt) {
                        const created = data.createdAt.toDate();
                        const diffMins = (now - created) / 1000 / 60;
                        if (diffMins > 5) {
                            deletePromises.push(deleteDoc(doc(db, 'bookings', document.id)));
                        }
                    }
                });

                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                    console.log(`Cleaned up ${deletePromises.length} expired reservations.`);
                }
            } catch (error) {
                console.error("Auto-cleanup error:", error);
            }
        };

        // Run immediately and then every minute
        cleanupExpiredReservations();
        const interval = setInterval(cleanupExpiredReservations, 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
        </div>
    );
}
