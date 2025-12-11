// src/services/scheduleService.js
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";

/**
 * Get court schedule (operating hours and special dates)
 * @param {string} courtId
 * @returns {Object} Schedule object
 */
export async function getCourtSchedule(courtId) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      return scheduleSnap.data();
    }

    // Return default schedule if none exists
    return getDefaultSchedule();
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}

/**
 * Create or update court schedule
 * @param {string} courtId
 * @param {Object} scheduleData
 * @returns {void}
 */
export async function setCourtSchedule(courtId, scheduleData) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);

    await setDoc(
      scheduleRef,
      {
        ...scheduleData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Log the action
    await addDoc(collection(db, "bookingLogs"), {
      action: "schedule_updated",
      courtId,
      performedBy: scheduleData.updatedBy || "system",
      performedByRole: scheduleData.updatedByRole || "manager",
      timestamp: serverTimestamp(),
      newData: scheduleData,
    });

    console.log("Schedule updated successfully");
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw error;
  }
}

/**
 * Update operating hours for specific day
 * @param {string} courtId
 * @param {string} day - 'monday', 'tuesday', etc.
 * @param {Object} hours - { open: "06:00", close: "22:00", isOpen: true }
 */
export async function updateOperatingHours(courtId, day, hours) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);

    await updateDoc(scheduleRef, {
      [`operatingHours.${day}`]: hours,
      updatedAt: serverTimestamp(),
    });

    console.log(`Operating hours updated for ${day}`);
  } catch (error) {
    console.error("Error updating operating hours:", error);
    throw error;
  }
}

/**
 * Add special date (holiday, maintenance, etc.)
 * @param {string} courtId
 * @param {Object} specialDate - { date: "2025-12-25", isClosed: true, reason: "Holiday" }
 */
export async function addSpecialDate(courtId, specialDate) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (!scheduleSnap.exists()) {
      // Create new schedule with special date
      await setDoc(scheduleRef, {
        operatingHours: getDefaultSchedule().operatingHours,
        specialDates: [specialDate],
        createdAt: serverTimestamp(),
      });
    } else {
      // Add to existing special dates
      const currentSchedule = scheduleSnap.data();
      const specialDates = currentSchedule.specialDates || [];

      // Check if date already exists
      const existingIndex = specialDates.findIndex(
        (sd) => sd.date === specialDate.date
      );

      if (existingIndex >= 0) {
        // Update existing special date
        specialDates[existingIndex] = specialDate;
      } else {
        // Add new special date
        specialDates.push(specialDate);
      }

      await updateDoc(scheduleRef, {
        specialDates,
        updatedAt: serverTimestamp(),
      });
    }

    console.log("Special date added successfully");
  } catch (error) {
    console.error("Error adding special date:", error);
    throw error;
  }
}

/**
 * Remove special date
 * @param {string} courtId
 * @param {string} date - Format: YYYY-MM-DD
 */
export async function removeSpecialDate(courtId, date) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      const currentSchedule = scheduleSnap.data();
      const specialDates = (currentSchedule.specialDates || []).filter(
        (sd) => sd.date !== date
      );

      await updateDoc(scheduleRef, {
        specialDates,
        updatedAt: serverTimestamp(),
      });

      console.log("Special date removed successfully");
    }
  } catch (error) {
    console.error("Error removing special date:", error);
    throw error;
  }
}

/**
 * Check if court is open on a specific date
 * @param {Object} schedule
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @param {string} dayOfWeek - 'monday', 'tuesday', etc.
 * @returns {Object} { isOpen: boolean, reason: string, hours: Object }
 */
export function checkCourtAvailability(schedule, dateStr, dayOfWeek) {
  // Check special dates first
  const specialDate = (schedule.specialDates || []).find(
    (sd) => sd.date === dateStr
  );

  if (specialDate) {
    return {
      isOpen: !specialDate.isClosed,
      reason: specialDate.reason || "Special date",
      hours: specialDate.hours || null,
    };
  }

  // Check regular operating hours
  const daySchedule = schedule.operatingHours?.[dayOfWeek];

  if (!daySchedule || !daySchedule.isOpen) {
    return {
      isOpen: false,
      reason: "Court closed on this day",
      hours: null,
    };
  }

  return {
    isOpen: true,
    reason: "Regular operating hours",
    hours: {
      open: daySchedule.open,
      close: daySchedule.close,
    },
  };
}

/**
 * Block specific time slots for a court
 * @param {string} courtId
 * @param {Object} blockedSlot - { date: "2025-12-15", startTime: "10:00", endTime: "12:00", reason: "Maintenance" }
 */
export async function blockTimeSlot(courtId, blockedSlot) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (!scheduleSnap.exists()) {
      // Create new schedule with blocked slot
      await setDoc(scheduleRef, {
        operatingHours: getDefaultSchedule().operatingHours,
        specialDates: [],
        blockedSlots: [blockedSlot],
        createdAt: serverTimestamp(),
      });
    } else {
      // Add to existing blocked slots
      const currentSchedule = scheduleSnap.data();
      const blockedSlots = currentSchedule.blockedSlots || [];

      // Check if slot already exists (same date and time range)
      const existingIndex = blockedSlots.findIndex(
        (bs) =>
          bs.date === blockedSlot.date &&
          bs.startTime === blockedSlot.startTime &&
          bs.endTime === blockedSlot.endTime
      );

      if (existingIndex >= 0) {
        // Update existing blocked slot
        blockedSlots[existingIndex] = blockedSlot;
      } else {
        // Add new blocked slot
        blockedSlots.push(blockedSlot);
      }

      await updateDoc(scheduleRef, {
        blockedSlots,
        updatedAt: serverTimestamp(),
      });
    }

    console.log("Time slot blocked successfully");
  } catch (error) {
    console.error("Error blocking time slot:", error);
    throw error;
  }
}

/**
 * Remove blocked time slot
 * @param {string} courtId
 * @param {string} date - Format: YYYY-MM-DD
 * @param {string} startTime - Format: HH:MM
 * @param {string} endTime - Format: HH:MM
 */
export async function unblockTimeSlot(courtId, date, startTime, endTime) {
  try {
    const scheduleRef = doc(db, "schedules", courtId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      const currentSchedule = scheduleSnap.data();
      const blockedSlots = (currentSchedule.blockedSlots || []).filter(
        (bs) =>
          !(
            bs.date === date &&
            bs.startTime === startTime &&
            bs.endTime === endTime
          )
      );

      await updateDoc(scheduleRef, {
        blockedSlots,
        updatedAt: serverTimestamp(),
      });

      console.log("Time slot unblocked successfully");
    }
  } catch (error) {
    console.error("Error unblocking time slot:", error);
    throw error;
  }
}

/**
 * Get default schedule template
 * @returns {Object}
 */
function getDefaultSchedule() {
  return {
    operatingHours: {
      monday: { open: "06:00", close: "22:00", isOpen: true },
      tuesday: { open: "06:00", close: "22:00", isOpen: true },
      wednesday: { open: "06:00", close: "22:00", isOpen: true },
      thursday: { open: "06:00", close: "22:00", isOpen: true },
      friday: { open: "06:00", close: "22:00", isOpen: true },
      saturday: { open: "06:00", close: "23:00", isOpen: true },
      sunday: { open: "07:00", close: "23:00", isOpen: true },
    },
    specialDates: [],
    blockedSlots: [],
  };
}

export { getDefaultSchedule };
