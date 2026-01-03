// src/utils/scheduling.js

export const allocateWorkingHours = (startTime, durationMinutes, breaks = [], holidays = []) => {
  const slots = [];
  let remaining = durationMinutes;
  let current = new Date(startTime);

  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 18;

  const isHoliday = (dateStr) => holidays.some(h => h.holiday_date === dateStr);

  const isSecondOrFourthSaturday = (date) => {
    const day = date.getDay();
    const dateNum = date.getDate();
    const week = Math.ceil(dateNum / 7);
    return day === 6 && (week === 2 || week === 4);
  };

  const isInBreak = (time, dayBreaks) => {
    return dayBreaks.some(b => {
      const [bsH, bsM] = b.break_start.split(':').map(Number);
      const [beH, beM] = b.break_end.split(':').map(Number);
      const breakStart = new Date(time);
      breakStart.setHours(bsH, bsM, 0, 0);
      const breakEnd = new Date(time);
      breakEnd.setHours(beH, beM, 0, 0);
      return time >= breakStart && time < breakEnd;
    });
  };

  const getNextBreakEnd = (time, dayBreaks) => {
    for (const b of dayBreaks) {
      const [bsH, bsM] = b.break_start.split(':').map(Number);
      const [beH, beM] = b.break_end.split(':').map(Number);
      const breakStart = new Date(time);
      breakStart.setHours(bsH, bsM, 0, 0);
      const breakEnd = new Date(time);
      breakEnd.setHours(beH, beM, 0, 0);
      if (time >= breakStart && time < breakEnd) return breakEnd;
    }
    return null;
  };

  while (remaining > 0) {
    const currentDateStr = current.toISOString().split("T")[0];
    const currentDay = current.getDay();

    if (
      currentDay === 0 ||
      isHoliday(currentDateStr) ||
      isSecondOrFourthSaturday(current)
    ) {
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }

    const workStart = new Date(current);
    workStart.setHours(WORK_START_HOUR, 0, 0, 0);
    const workEnd = new Date(current);
    workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    if (current >= workEnd) {
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }

    if (current < workStart) current = new Date(workStart);

    // 🛑 Ensure start doesn't fall inside a break
    const dayBreaks = breaks.map((b) => ({ ...b }));
    for (const b of dayBreaks) {
      const [bsH, bsM] = b.break_start.split(":").map(Number);
      const [beH, beM] = b.break_end.split(":").map(Number);

      const breakStart = new Date(current);
      breakStart.setHours(bsH, bsM, 0, 0);
      const breakEnd = new Date(current);
      breakEnd.setHours(beH, beM, 0, 0);

      // If current is at or within break → skip to break end
      if (current >= breakStart && current < breakEnd) {
        current = new Date(breakEnd);
        break; // Only one break can match at a time
      }
    }

    const tempSlotStart = new Date(current);
    let tempSlotEnd = new Date(current);
    let minutesUsed = 0;

    while (minutesUsed < remaining && tempSlotEnd < workEnd) {
      if (isInBreak(tempSlotEnd, dayBreaks)) {
        const breakEnd = getNextBreakEnd(tempSlotEnd, dayBreaks);
        tempSlotEnd = breakEnd;
        current = new Date(tempSlotEnd);
        continue;
      }

      tempSlotEnd = new Date(tempSlotEnd.getTime() + 60000); // +1 minute
      minutesUsed++;
    }

    if (tempSlotEnd > tempSlotStart) {
      slots.push({
        start: new Date(tempSlotStart),
        end: new Date(tempSlotEnd),
      });
      current = new Date(tempSlotEnd);
      remaining -= minutesUsed;
    } else {
      // No usable time → move to next working day
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START_HOUR, 0, 0, 0);
    }
  }

  return slots;
};

export const calculateDurationFromTimes = (startStr, endStr) => {
  const start = new Date(startStr);
  const end = new Date(endStr);

  const WORK_START_HOUR = 9;
  const WORK_END_HOUR = 18;
  let totalMinutes = 0;

  let current = new Date(start);
  while (current < end) {
    const day = current.getDay();
    if (day !== 0) {
      const workDayStart = new Date(current);
      workDayStart.setHours(WORK_START_HOUR, 0, 0, 0);

      const workDayEnd = new Date(current);
      workDayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

      const sliceStart = current > workDayStart ? current : workDayStart;
      const sliceEnd = end < workDayEnd ? end : workDayEnd;

      if (sliceEnd > sliceStart) {
        totalMinutes += Math.floor((sliceEnd - sliceStart) / 60000);
      }
    }

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return totalMinutes;
};
