// src/services/slotService.js
import { db, auth } from './firebase';
import { 
  collection, 
  doc,
  addDoc, 
  updateDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { isSlotAvailable } from '../utils/slotValidator';
import { addMinutes } from '../utils/dateHelpers';

/**
 * Reserve a slot (5-minute temporary hold)
 * This prevents other users from booking the same slot
 * 
 * @param {string} courtId
 * @param {string} date
 * @param {string} startTime
 * @param {string} userId
 * @returns {Promise<string>} bookingId
 */
export async function reserveSlot(courtId, date, startTime, userId) {
  try {
    // 1. Check if slot is still available
    const available = await isSlotAvailable(courtId, date, startTime);
    
    if (!available) {
      throw new Error('This slot is no longer available. Please choose another slot.');
    }
    
    // 2. Get court details
    const courtRef = doc(db, 'courts', courtId);
    const courtSnap = await getDoc(courtRef);
    
    if (!courtSnap.exists()) {
      throw new Error('Court not found');
    }
    
    const courtData = courtSnap.data();
    
    // 3. Get user details
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    
    // 4. Calculate end time
    const endTime = addMinutes(startTime, courtData.slotDuration || 30);
    
    // 5. Create reservation
    const bookingData = {
      userId,
      userName: userData.displayName || auth.currentUser?.displayName || 'User',
      userEmail: userData.email || auth.currentUser?.email || '',
      courtId,
      courtName: courtData.name,
      sportType: courtData.sportType,
      date,
      startTime,
      endTime,
      duration: courtData.slotDuration || 30,
      amount: courtData.pricePerSlot,
      paymentStatus: 'pending',
      bookingStatus: 'reserved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
    
    // 6. Create log entry
    await addDoc(collection(db, 'bookingLogs'), {
      bookingId: bookingRef.id,
      courtId,
      userId,
      action: 'slot_reserved',
      performedBy: userId,
      performedByRole: 'user',
      timestamp: serverTimestamp(),
      newData: bookingData
    });
    
    console.log('Slot reserved successfully:', bookingRef.id);
    return bookingRef.id;
    
  } catch (error) {
    console.error('Error reserving slot:', error);
    throw error;
  }
}

/**
 * Confirm booking after payment success
 * @param {string} bookingId
 * @param {Object} paymentData
 */
export async function confirmBooking(bookingId, paymentData) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    
    await updateDoc(bookingRef, {
      bookingStatus: 'confirmed',
      paymentStatus: 'completed',
      paymentId: paymentData.paymentId,
      razorpayOrderId: paymentData.orderId,
      updatedAt: serverTimestamp()
    });
    
    // Create log
    await addDoc(collection(db, 'bookingLogs'), {
      bookingId,
      action: 'payment_completed',
      performedBy: paymentData.userId,
      performedByRole: 'user',
      timestamp: serverTimestamp(),
      newData: paymentData
    });
    
    console.log('Booking confirmed successfully');
  } catch (error) {
    console.error('Error confirming booking:', error);
    throw error;
  }
}

/**
 * Cancel booking (release slot)
 * @param {string} bookingId
 * @param {string} reason
 */
export async function cancelBooking(bookingId, reason = 'User cancelled') {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      throw new Error('Booking not found');
    }
    
    const bookingData = bookingSnap.data();
    
    await updateDoc(bookingRef, {
      bookingStatus: 'cancelled',
      cancelReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Create log
    await addDoc(collection(db, 'bookingLogs'), {
      bookingId,
      courtId: bookingData.courtId,
      userId: bookingData.userId,
      action: 'cancelled',
      performedBy: auth.currentUser?.uid,
      performedByRole: 'user',
      reason,
      timestamp: serverTimestamp(),
      oldData: bookingData
    });
    
    console.log('Booking cancelled successfully');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}
