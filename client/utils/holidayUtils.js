/**
 * Centralized Holiday and Weekend Validation Utilities
 */

/**
 * Checks if a date is the 2nd or 4th Saturday of the month.
 * @param {Date|string} dateOrStr 
 * @returns {boolean}
 */
export const isSecondOrFourthSaturday = (dateOrStr) => {
    const date = new Date(dateOrStr);
    const day = date.getDay();
    if (day !== 6) return false;

    const dateNum = date.getDate();
    const week = Math.ceil(dateNum / 7);
    return week === 2 || week === 4;
};

/**
 * Checks if a date is a Sunday, 2nd/4th Saturday, or a declared holiday.
 * @param {Date|string} dateOrStr 
 * @param {Array<string>} holidays - Array of ISO date strings (YYYY-MM-DD)
 * @returns {object} { isHoliday: boolean, reason: string|null }
 */
export const isHolidayOrWeekend = (dateOrStr, holidays = []) => {
    const date = new Date(dateOrStr);
    const day = date.getDay();

    // Get local YYYY-MM-DD to avoid timezone shifts from toISOString()
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayOfMonth}`;

    if (day === 0) return { isHoliday: true, reason: 'Sunday' };

    if (isSecondOrFourthSaturday(date)) {
        return { isHoliday: true, reason: 'the 2nd/4th Saturday' };
    }

    // Ensure holidays is an array and check for the date string
    const holidayList = Array.isArray(holidays) ? holidays : [];
    if (holidayList.includes(dateStr)) {
        return { isHoliday: true, reason: 'a Declared Holiday' };
    }

    return { isHoliday: false, reason: null };
};
