// src/utils/dateHelpers.js

/**
 * Get day of week from date string
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @returns {string} - 'monday', 'tuesday', etc.
 */
export function getDayOfWeek(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

/**
 * Add minutes to a time string
 * @param {string} time - Format: HH:MM
 * @param {number} minutes - Minutes to add
 * @returns {string} - Format: HH:MM
 */
export function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  
  return date.toTimeString().slice(0, 5); // Returns HH:MM
}

/**
 * Check if a date is in the past
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @returns {boolean}
 */
export function isPastDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(dateStr);
  return checkDate < today;
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM format
 * @returns {string}
 */
export function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

/**
 * Compare two times
 * @param {string} time1 - Format: HH:MM
 * @param {string} time2 - Format: HH:MM
 * @returns {number} - Negative if time1 < time2, 0 if equal, positive if time1 > time2
 */
export function compareTime(time1, time2) {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  
  return minutes1 - minutes2;
}

/**
 * Check if date is today
 * @param {string} dateStr - Format: YYYY-MM-DD
 * @returns {boolean}
 */
export function isToday(dateStr) {
  const today = formatDate(new Date());
  return dateStr === today;
}
