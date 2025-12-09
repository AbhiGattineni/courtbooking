// src/components/public/SportTypeFilter.jsx
const sportTypes = [
  { id: 'all', name: 'All Sports', icon: '🏆' },
  { id: 'cricket', name: 'Cricket', icon: '🏏' },
  { id: 'football', name: 'Football', icon: '⚽' },
  { id: 'tennis', name: 'Tennis', icon: '🎾' },
  { id: 'badminton', name: 'Badminton', icon: '🏸' },
  { id: 'basketball', name: 'Basketball', icon: '🏀' }
];

export default function SportTypeFilter({ selected, onSelect }) {
  return (
    <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
      {sportTypes.map(sport => (
        <button
          key={sport.id}
          onClick={() => onSelect(sport.id)}
          className={`flex-shrink-0 px-6 py-3 rounded-lg font-medium transition-all ${selected === sport.id
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          <span className="mr-2">{sport.icon}</span>
          {sport.name}
        </button>
      ))}
    </div>
  );
}
