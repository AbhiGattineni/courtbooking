// src/components/public/SportTypeFilter.jsx
import { useState, useRef, useEffect } from 'react';
import { FaFutbol, FaBasketballBall, FaChevronDown } from 'react-icons/fa';
import { MdSportsCricket, MdSportsTennis } from 'react-icons/md';
import { GiShuttlecock } from 'react-icons/gi';

export const sportTypes = [
  { id: 'cricket', name: 'Cricket', icon: MdSportsCricket },
  { id: 'football', name: 'Football', icon: FaFutbol },
  { id: 'tennis', name: 'Tennis', icon: MdSportsTennis },
  { id: 'badminton', name: 'Badminton', icon: GiShuttlecock },
  { id: 'basketball', name: 'Basketball', icon: FaBasketballBall }
];

export default function SportTypeFilter({ selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedSport = sportTypes.find(s => s.id === selected) || sportTypes[0];
  const Icon = selectedSport?.icon;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative w-full max-w-xs" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Sport</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-3 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <span className="flex items-center">
          {Icon && <Icon className="h-5 w-5 text-gray-500 mr-2" />}
          <span className="block truncate font-medium text-gray-900">{selectedSport?.name}</span>
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <FaChevronDown className="h-4 w-4 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {sportTypes.map((sport) => {
            const SportIcon = sport.icon;
            return (
              <li
                key={sport.id}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${selected === sport.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                onClick={() => {
                  onSelect(sport.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  <SportIcon className={`h-5 w-5 mr-2 ${selected === sport.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`block truncate ${selected === sport.id ? 'font-semibold' : 'font-normal'}`}>
                    {sport.name}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
