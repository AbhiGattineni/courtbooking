// src/components/public/CourtsList.jsx
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore"; // Changed to onSnapshot for Realtime Courts too
import { db } from "../../services/firebase";
import CourtCard from "./CourtCard";
import LoadingSpinner from "../common/LoadingSpinner";
import DateStrip from "./DateStrip";
import { FaRunning } from "react-icons/fa";

export default function CourtsList() {
  const [courts, setCourts] = useState([]);
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("all");
  const [sportTypes, setSportTypes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Realtime listeners for courts to ensure "no static injected"
    const q = query(collection(db, "courts"), where("isActive", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courtsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourts(courtsData);

      // Extract unique sport types dynamically
      const types = [...new Set(courtsData.map((c) => c.sportType || "other"))];
      setSportTypes(types);

      // select first sport by default if 'all' isn't desired or if currently selected is invalid
      if (selectedSport === "all" && types.length > 0)
        setSelectedSport(types[0]);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (courts.length > 0) {
      // Filter logic
      if (selectedSport === "all") {
        setFilteredCourts(courts);
      } else {
        setFilteredCourts(
          courts.filter(
            (court) => (court.sportType || "other") === selectedSport
          )
        );
      }
    }
  }, [selectedSport, courts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Book a Court
          </h1>
          <p className="text-gray-600">
            Select date and sport to find available slots
          </p>
        </div>

        {/* Filters Container */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 mb-8 space-y-6">
          {/* Date Filter */}
          <div>
            <DateStrip
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          <div className="border-t border-gray-100 pt-6"></div>

          {/* Dynamic Sport Filter - DROPDOWN */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 py-3 px-6 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-blue-500 font-bold capitalize cursor-pointer shadow-sm min-w-[200px]"
              >
                {sportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Courts Grid */}
        {filteredCourts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <FaRunning className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              No courts available for this sport.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {filteredCourts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                selectedDate={selectedDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
