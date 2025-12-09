// src/components/public/CourtsList.jsx
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import CourtCard from './CourtCard';
import LoadingSpinner from '../common/LoadingSpinner';
import SportTypeFilter from './SportTypeFilter';

export default function CourtsList() {
  const [courts, setCourts] = useState([]);
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('all');

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    if (selectedSport === 'all') {
      setFilteredCourts(courts);
    } else {
      setFilteredCourts(courts.filter(court => court.sportType === selectedSport));
    }
  }, [selectedSport, courts]);

  const fetchCourts = async () => {
    try {
      const courtsRef = collection(db, 'courts');
      const q = query(courtsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);

      const courtsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCourts(courtsData);
      setFilteredCourts(courtsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Available Courts</h1>
          <p className="text-gray-600">Browse and book courts by sport type</p>
        </div>

        {/* Sport Filter */}
        <div className="mb-8">
          <SportTypeFilter selected={selectedSport} onSelect={setSelectedSport} />
        </div>

        {/* Courts Grid */}
        {filteredCourts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-xl">No courts found for {selectedSport}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourts.map(court => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
