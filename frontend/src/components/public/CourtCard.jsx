// src/components/public/CourtCard.jsx
import { Link } from 'react-router-dom';
import Card from '../common/Card';

export default function CourtCard({ court }) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      {/* Court Image */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {court.images && court.images[0] ? (
          <img
            src={court.images[0]}
            alt={court.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
            {court.sportType === 'cricket' ? '🏏' :
              court.sportType === 'football' ? '⚽' :
                court.sportType === 'tennis' ? '🎾' :
                  court.sportType === 'badminton' ? '🏸' :
                    court.sportType === 'basketball' ? '🏀' : '🏆'}
          </div>
        )}

        {/* Sport Type Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          {court.sportType}
        </div>
      </div>

      {/* Court Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{court.name}</h3>
        <p className="text-gray-500 text-sm mb-4 flex items-center">
          <span className="mr-1">📍</span> {court.location}
        </p>

        {/* Facilities */}
        {court.facilities && court.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {court.facilities.slice(0, 3).map((facility, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium"
              >
                {facility}
              </span>
            ))}
          </div>
        )}

        {/* Price and Button */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-2xl font-bold text-blue-600">₹{court.pricePerSlot}</span>
            <span className="text-gray-500 text-sm">/30 min</span>
          </div>
          <Link
            to={`/court/${court.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Book Now
          </Link>
        </div>
      </div>
    </Card>
  );
}
