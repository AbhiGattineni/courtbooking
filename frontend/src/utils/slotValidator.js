// src/utils/slotValidator.js
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getDayOfWeek, isToday } from './dateHelpers';
import { generateSlotStructure, filterFutureSlots } from './slotGenerator';
import { getCourtSchedule, checkCourtAvailability } from '../services/scheduleService';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Get available slots for a court on a specific date
 * This is the MAIN function that prevents double-booking
 * 
 * @param {string} courtId
 * @param {string} date - Format: YYYY-MM-DD
 * @returns {Array<Object>} Array of available slots
 */
export async function getAvailableSlots(courtId, date) {
  try {
    // 1. Get court details for pricing
    const courtRef = await getDoc(doc(db, 'courts', courtId));
    if (!courtRef.exists()) {
      throw new Error('Court not found');
    }
    
    const courtData = courtRef.data();
    const pricePerSlot = courtData.pricePerSlot || 500;
    const slotDuration = courtData.slotDuration || 30;
    
    // 2. Get court schedule
    const schedule = await getCourtSchedule(courtId);
    
    // 3. Check if court is open on this date
    const dayOfWeek = getDayOfWeek(date);
    const availability = checkCourtAvailability(schedule, date, dayOfWeek);
    
    if (!availability.isOpen) {
      return {
        slots: [],
        message: availability.reason,
        isOpen: false
      };
    }
    
    // 4. Generate all possible slots
    const { open, close } = availability.hours;
    let allSlots = generateSlotStructure(open, close, pricePerSlot, slotDuration);
    
    // 5. If today, filter out past slots
    if (isToday(date)) {
      allSlots = filterFutureSlots(allSlots, true);
    }
    
    // 6. Fetch all bookings for this court and date
    const bookings = await getBookingsForDate(courtId, date);
    
    // 7. Mark slots as unavailable if booked/reserved/pending
    const blockedSlots = getBlockedSlots(bookings);
    
    allSlots.forEach(slot => {
      if (blockedSlots.includes(slot.startTime)) {
        slot.isAvailable = false;
        const booking = bookings.find(b => b.startTime === slot.startTime);
        slot.bookingId = booking?.id || null;
        slot.bookingStatus = booking?.bookingStatus || null;
      }
    });
    
    return {
      slots: allSlots,
      message: 'Slots loaded successfully',
      isOpen: true,
      totalSlots: allSlots.length,
      availableCount: allSlots.filter(s => s.isAvailable).length,
      bookedCount: allSlots.filter(s => !s.isAvailable).length
    };
    
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
}

/**
 * Fetch all bookings for a specific court and date
 * @param {string} courtId
 * @param {string} date
 * @returns {Array<Object>}
 */
async function getBookingsForDate(courtId, date) {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('courtId', '==', courtId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
}

/**
 * Get list of blocked time slots
 * Blocks slots that are: confirmed, pending, or reserved (not expired)
 * 
 * @param {Array<Object>} bookings
 * @returns {Array<string>} Array of blocked time strings
 */
function getBlockedSlots(bookings) {
  const now = Date.now();
  
  return bookings
    .filter(booking => {
      // Always block confirmed bookings
      if (booking.bookingStatus === 'confirmed') {
        return true;
      }
      
      // Block pending payments (within 10 minutes)
      if (booking.paymentStatus === 'pending') {
        const createdTime = booking.createdAt?.toMillis() || 0;
        const timeDiff = now - createdTime;
        return timeDiff < 10 * 60 * 1000; // 10 minutes
      }
      
      // Block reserved slots (within 5 minutes)
      if (booking.bookingStatus === 'reserved') {
        const createdTime = booking.createdAt?.toMillis() || 0;
        const timeDiff = now - createdTime;
        return timeDiff < 5 * 60 * 1000; // 5 minutes
      }
      
      // Don't block cancelled or expired bookings
      return false;
    })
    .map(booking => booking.startTime);
}

/**
 * Check if a specific slot is available
 * Use this before reserving a slot
 * 
 * @param {string} courtId
 * @param {string} date
 * @param {string} startTime
 * @returns {Promise<boolean>}
 */
export async function isSlotAvailable(courtId, date, startTime) {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('courtId', '==', courtId),
      where('date', '==', date),
      where('startTime', '==', startTime)
    );
    
    const snapshot = await getDocs(q);
    
    // If no bookings, slot is available
    if (snapshot.empty) {
      return true;
    }
    
    // Check if any non-expired bookings exist
    const now = Date.now();
    
    const validBookings = snapshot.docs.filter(doc => {
      const booking = doc.data();
      
      // Confirmed bookings always block
      if (booking.bookingStatus === 'confirmed') {
        return true;
      }
      
      // Check if pending/reserved is expired
      const createdTime = booking.createdAt?.toMillis() || 0;
      const timeDiff = now - createdTime;
      
      if (booking.bookingStatus === 'reserved') {
        return timeDiff < 5 * 60 * 1000; // 5 minutes
      }
      
      if (booking.paymentStatus === 'pending') {
        return timeDiff < 10 * 60 * 1000; // 10 minutes
      }
      
      return false;
    });
    
    // Slot is available if no valid bookings exist
    return validBookings.length === 0;
    
  } catch (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }
}
