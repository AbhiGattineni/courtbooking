import { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { dummyCourts } from '../../data/dummyCourts';
import { defaultOperatingHours, dummySpecialDates } from '../../data/dummySchedules';
import { dummyBookings } from '../../data/dummyBookings';

export default function SeedDatabase() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    const clearCollection = async (collectionName) => {
        setStatus(`Clearing ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        const deletePromises = querySnapshot.docs.map((document) =>
            deleteDoc(doc(db, collectionName, document.id))
        );
        await Promise.all(deletePromises);
    };

    const seedAll = async () => {
        try {
            setLoading(true);
            setError('');

            // 1. Clear all existing data
            await clearCollection('courts');
            await clearCollection('schedules');
            await clearCollection('bookings');

            // 2. Seed Courts and link Schedules
            setStatus('Seeding courts and schedules...');
            const courtsCollection = collection(db, 'courts');
            const schedulesCollection = collection(db, 'schedules');

            const courtIdMap = {}; // name -> id mapping for bookings

            let courtCount = 0;
            for (const court of dummyCourts) {
                // Add Court
                const courtRef = await addDoc(courtsCollection, {
                    ...court,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                const courtId = courtRef.id;
                courtIdMap[court.name] = courtId;
                courtCount++;

                // Add Schedule for this court (using custom document ID same as courtId)
                await setDoc(doc(db, 'schedules', courtId), {
                    courtId: courtId,
                    operatingHours: defaultOperatingHours,
                    specialDates: dummySpecialDates,
                    updatedAt: new Date()
                });
            }
            setStatus(`Added ${courtCount} courts and schedules.`);

            // 3. Seed Bookings
            setStatus('Seeding bookings...');
            const bookingsCollection = collection(db, 'bookings');
            let bookingCount = 0;

            for (const booking of dummyBookings) {
                // Find the real courtId based on the courtName in dummy data
                const realCourtId = courtIdMap[booking.courtName];

                if (realCourtId) {
                    const bookingData = { ...booking };
                    delete bookingData.courtName; // Remove helper field

                    await addDoc(bookingsCollection, {
                        ...bookingData,
                        courtId: realCourtId,
                        courtName: booking.courtName, // Keep name for display
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    bookingCount++;
                }
            }

            setStatus(`Success! Added ${courtCount} courts/schedules and ${bookingCount} bookings.`);

        } catch (err) {
            console.error("Error seeding database:", err);
            setError('Failed to seed database: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Full Database Seeder</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">System Reset & Seed</h2>
                    <p className="text-gray-600 mb-4">
                        This will <strong>DELETE ALL DATA</strong> in 'courts', 'schedules', and 'bookings',
                        and re-populate them with the latest dummy data from the Project Plan.
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-500 mb-4">
                        <li>Courts: {dummyCourts.length} records</li>
                        <li>Schedules: {dummyCourts.length} records (1 per court)</li>
                        <li>Bookings: {dummyBookings.length} sample records</li>
                    </ul>
                </div>

                <div className="space-x-4">
                    <button
                        onClick={seedAll}
                        disabled={loading}
                        className={`px-6 py-3 rounded text-white font-bold text-lg w-full ${loading
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                            }`}
                    >
                        {loading ? 'Processing System Reset...' : '⚠ Reset & Seed Full Database'}
                    </button>
                </div>

                {status && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-md">
                        <strong>Status:</strong> {status}
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-md">
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
        </div>
    );
}
