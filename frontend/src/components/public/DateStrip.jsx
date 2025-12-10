import React, { useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function DateStrip({ selectedDate, onSelectDate }) {
    const scrollContainerRef = useRef(null);

    // Generate next 14 days
    const dates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 200;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const isSameDate = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    return (
        <div className="relative group">
            {/* Left Gradient Fade (Start transparent, fade to white on left edge) */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

            {/* Left Button */}
            <div className="absolute left-0 top-0 bottom-0 w-10 z-20 flex items-center justify-center">
                <button
                    onClick={() => scroll('left')}
                    className="bg-white/90 shadow-sm rounded-full p-1.5 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all hidden group-hover:block border border-gray-100"
                >
                    <FaChevronLeft size={10} />
                </button>
            </div>

            {/* Right Gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

            {/* Right Button */}
            <div className="absolute right-0 top-0 bottom-0 w-10 z-20 flex items-center justify-center">
                <button
                    onClick={() => scroll('right')}
                    className="bg-white/90 shadow-sm rounded-full p-1.5 text-gray-500 hover:text-blue-600 hover:shadow-md transition-all hidden group-hover:block border border-gray-100"
                >
                    <FaChevronRight size={10} />
                </button>
            </div>

            {/* Dates Container */}
            <div
                ref={scrollContainerRef}
                className="flex space-x-3 overflow-x-auto scrollbar-hide py-3 px-4 relative scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDate(date, selectedDate);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    const dayNumber = date.getDate();
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

                    return (
                        <button
                            key={index}
                            onClick={() => onSelectDate(date)}
                            className={`
                                flex-shrink-0 flex flex-col items-center justify-center 
                                w-16 h-20 rounded-xl transition-all duration-300 border
                                ${isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105 ring-2 ring-blue-200'
                                    : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm'
                                }
                            `}
                        >
                            <span className={`text-[10px] font-bold tracking-wider ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                {dayName}
                            </span>
                            <span className="text-2xl font-bold leading-none my-1">
                                {dayNumber}
                            </span>
                            <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                {monthName}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
