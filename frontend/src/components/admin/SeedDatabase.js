import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Button from '../common/Button';

export default function SeedDatabase() {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const seedCourts = async () => {
        setStatus('Seeding detailed courts...');
        const courts = [
            { name: "Thunder Pitch", sportType: "cricket", location: "Mumbai Central", pricePerSlot: 1500, isActive: true, facilities: ["Floodlights", "Changing Room"] },
            { name: "Green Field", sportType: "football", location: "Andheri West", pricePerSlot: 2000, isActive: true, facilities: ["Turf", "Water", "Parking"] },
            { name: "Smash Zone", sportType: "badminton", location: "Bandra", pricePerSlot: 800, isActive: true, facilities: ["Indoor", "AC", "Rackets"] },
            { name: "Ace Court", sportType: "tennis", location: "Juhu", pricePerSlot: 1200, isActive: true, facilities: ["Clay Court", "Coach"] },
            { name: "Hoops Arena", sportType: "basketball", location: "Powai", pricePerSlot: 1000, isActive: true, facilities: ["Hard Court"] },
            { name: "Legacy Cricket Ground", sportType: "cricket", location: "Thane", pricePerSlot: 1200, isActive: false, facilities: ["Grass"] }
        ];

        for (const court of courts) {
            await addDoc(collection(db, 'courts'), {
                ...court,
                createdAt: serverTimestamp(),
                images: []
            });
        }
    };

    const seedUsers = async () => {
        setStatus('Seeding dummy users...');
        const users = [
            { uid: "user_001", email: "john@example.com", displayName: "John Doe", role: "user" },
            { uid: "user_002", email: "jane@admin.com", displayName: "Jane Admin", role: "superadmin" },
            { uid: "user_003", email: "bob@manager.com", displayName: "Bob Manager", role: "manager" },
            { uid: "user_004", email: "alice@test.com", displayName: "Alice Smith", role: "user" },
            { uid: "user_005", email: "mike@test.com", displayName: "Mike Johnson", role: "user" }
        ];

        for (const user of users) {
            // Note: We can't actually create Auth users from client SDK without password.
            // These will be Firestore-only records for the User Management table.
            await setDoc(doc(db, 'users', user.uid), {
                userId: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                phone: "555-0123",
                createdAt: serverTimestamp()
            });
        }
    };

    const seedBookings = async () => {
        setStatus('Seeding bookings...');
        // Create 10 dummy bookings
        for (let i = 0; i < 10; i++) {
            await addDoc(collection(db, 'bookings'), {
                courtName: i % 2 === 0 ? "Thunder Pitch" : "Green Field",
                userId: "user_001",
                userName: "John Doe",
                date: new Date().toISOString().split('T')[0],
                timeSlot: `${10 + i}:00 AM`,
                status: "confirmed",
                price: 1500,
                createdAt: serverTimestamp()
            });
        }
    };

    const handleSeed = async () => {
        // Simple confirm check or just run
        // if (!window.confirm(...)) return; 
        // For now, auto-run or use a better UI.

        setLoading(true);

        try {
            await seedCourts();
            await seedUsers();
            await seedBookings();
            setStatus('Seeding Complete!');
            console.log("Seeding complete");
            // No alert
        } catch (error) {
            console.error("Seeding failed", error);
            setStatus('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto mt-10 border rounded-xl shadow-lg bg-white text-center">
            <h1 className="text-2xl font-bold mb-4">Database Seeder</h1>
            <p className="text-gray-600 mb-6">Populate Cloud Firestore with test data for Users, Courts, and Bookings.</p>

            <div className="mb-6 p-3 bg-gray-50 rounded text-sm font-mono text-gray-700 min-h-[3rem]">
                {status || "Ready..."}
            </div>

            <Button onClick={handleSeed} disabled={loading} className="w-full">
                {loading ? 'Seeding...' : 'Inject Test Data'}
            </Button>
        </div>
    );
}
