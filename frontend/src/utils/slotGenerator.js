// src/utils/slotGenerator.js
import { addMinutes, compareTime } from './dateHelpers';

/**
 * Generate time slots between open and close time
 * @param {string} openTime - Format: HH:MM (e.g., "06:00")
 * @param {string} closeTime - Format: HH:MM (e.g., "22:00")
 * @param {number} duration - Slot duration in minutes (default: 30)
 * @returns {Array<string>} - Array of time strings ["06:00", "06:30", "07:00", ...]
 */
export function generateTimeSlots(openTime, closeTime, duration = 30) {
  const slots = [];
  let currentTime = openTime;
  
  // Generate slots until we reach close time
  while (compareTime(currentTime, closeTime) < 0) {
    slots.push(currentTime);
    currentTime = addMinutes(currentTime, duration);
  }
  
  return slots;
}

/**
 * Create slot intervals with start and end times
 * @param {Array<string>} slots - Array of time strings
 * @param {number} duration - Duration in minutes
 * @returns {Array<Object>} - Array of slot objects with startTime and endTime
 */
export function createSlotIntervals(slots, duration = 30) {
  return slots.map(time => ({
    startTime: time,
    endTime: addMinutes(time, duration),
    duration
  }));
}

/**
 * Generate complete slot structure with metadata
 * @param {string} openTime
 * @param {string} closeTime
 * @param {number} pricePerSlot
 * @param {number} duration
 * @returns {Array<Object>}
 */
export function generateSlotStructure(openTime, closeTime, pricePerSlot, duration = 30) {
  const times = generateTimeSlots(openTime, closeTime, duration);
  
  return times.map(time => ({
    startTime: time,
    endTime: addMinutes(time, duration),
    duration,
    price: pricePerSlot,
    isAvailable: true, // Will be updated based on bookings
    bookingId: null
  }));
}

/**
 * Filter slots to only show future slots for today
 * @param {Array<Object>} slots
 * @param {boolean} isToday
 * @returns {Array<Object>}
 */
export function filterFutureSlots(slots, isToday) {
  if (!isToday) return slots;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  return slots.filter(slot => {
    const [hours, mins] = slot.startTime.split(':').map(Number);
    const slotMinutes = hours * 60 + mins;
    
    // Only show slots that are at least 30 minutes in the future
    return slotMinutes > currentMinutes + 30;
  });
}
