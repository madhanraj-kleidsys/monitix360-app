// client/utils/Scheduling.js
export const allocateWorkingHours = (
    startTime,
    durationMinutes,
    shiftStart,
    shiftEnd,
    breaks = [],
    holidays = [],
    overrides = []
) => {
    const slots = [];
    let remaining = durationMinutes;
    let current = new Date(startTime);

    const parseHourMinute = (t) => {
        if (!t) return { h: 0, m: 0 };
        const [h, m] = t.split(":").map(Number);
        return { h, m: m || 0 };
    };

    const buildBreakTime = (base, h, m) => {
        const d = new Date(base);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const { h: WORK_START_HOUR, m: WORK_START_MIN } = parseHourMinute(shiftStart);
    const { h: WORK_END_HOUR, m: WORK_END_MIN } = parseHourMinute(shiftEnd);

    const isHoliday = (dateStr) =>
        holidays.some((h) => h.holiday_date === dateStr);

    const dayBreaks = breaks.map((b) => ({ ...b }));

    const isInBreak = (time) =>
        dayBreaks.some((b) => {
            const [bsH, bsM] = b.break_start.split(":").map(Number);
            const [beH, beM] = b.break_end.split(":").map(Number);
            const breakStart = buildBreakTime(time, bsH, bsM);
            const breakEnd = buildBreakTime(time, beH, beM);
            return time >= breakStart && time < breakEnd;
        });

    const getNextBreakEnd = (time) => {
        for (const b of dayBreaks) {
            const [bsH, bsM] = b.break_start.split(":").map(Number);
            const [beH, beM] = b.break_end.split(":").map(Number);
            const breakStart = buildBreakTime(time, bsH, bsM);
            const breakEnd = buildBreakTime(time, beH, beM);
            if (time >= breakStart && time < breakEnd) return breakEnd;
        }
        return null;
    };

    while (remaining > 0) {
        const currentDateStr = current.toISOString().split("T")[0];
        const currentDay = current.getDay();
        const is2nd4thSat = isSecondOrFourthSaturday(current, overrides);

        if (currentDay === 0 || isHoliday(currentDateStr) || is2nd4thSat) {
            current.setDate(current.getDate() + 1);
            current.setHours(WORK_START_HOUR, WORK_START_MIN, 0, 0);
            continue;
        }

        const workStart = buildBreakTime(current, WORK_START_HOUR, WORK_START_MIN);
        const workEnd = buildBreakTime(current, WORK_END_HOUR, WORK_END_MIN);

        if (current < workStart) current = new Date(workStart);
        if (current >= workEnd) {
            current.setDate(current.getDate() + 1);
            current.setHours(WORK_START_HOUR, WORK_START_MIN, 0, 0);
            continue;
        }

        const tempSlotStart = new Date(current);
        let tempSlotEnd = new Date(current);
        let minutesUsed = 0;

        while (minutesUsed < remaining && tempSlotEnd < workEnd) {
            if (isInBreak(tempSlotEnd)) {
                const next = getNextBreakEnd(tempSlotEnd);
                tempSlotEnd = next > workEnd ? workEnd : next;
                current = new Date(tempSlotEnd);
                continue;
            }
            tempSlotEnd.setMinutes(tempSlotEnd.getMinutes() + 1);
            minutesUsed++;
        }

        if (minutesUsed > 0) {
            slots.push({ start: tempSlotStart, end: tempSlotEnd });
            current = new Date(tempSlotEnd);
            remaining -= minutesUsed;
        } else {
            current.setMinutes(current.getMinutes() + 1);
        }
    }

    return slots;
};

export const calculateDurationFromTimes = (
    startStr,
    endStr,
    shiftStart,
    shiftEnd,
    breaksData = []
) => {
    if (!startStr || !endStr || !shiftStart || !shiftEnd) return 0;

    const start = new Date(startStr);
    const end = new Date(endStr);

    const parseHM = (t) => {
        const [h, m] = t.split(":").map(Number);
        return { h, m: m || 0 };
    };

    const { h: WORK_START_HOUR, m: WORK_START_MIN } = parseHM(shiftStart);
    const { h: WORK_END_HOUR, m: WORK_END_MIN } = parseHM(shiftEnd);

    let totalMinutes = 0;
    let current = new Date(start);

    const buildTime = (base, h, m) => {
        const d = new Date(base);
        d.setHours(h, m, 0, 0);
        return d;
    };

    while (current < end) {
        const day = current.getDay();

        // ❌ Skip Sunday
        if (day === 0) {
            current.setDate(current.getDate() + 1);
            current.setHours(0, 0, 0, 0);
            continue;
        }

        const workStart = buildTime(current, WORK_START_HOUR, WORK_START_MIN);
        const workEnd = buildTime(current, WORK_END_HOUR, WORK_END_MIN);

        const sliceStart = current > workStart ? current : workStart;
        const sliceEnd = end < workEnd ? end : workEnd;

        if (sliceEnd > sliceStart) {
            let minutes = Math.floor((sliceEnd - sliceStart) / 60000);

            // 🔻 Subtract breaks
            breaksData?.forEach((shift) => {
                shift.shift_breaks?.forEach((b) => {
                    const [bsH, bsM] = b.break_start.split(":").map(Number);
                    const [beH, beM] = b.break_end.split(":").map(Number);

                    const breakStart = buildTime(sliceStart, bsH, bsM);
                    const breakEnd = buildTime(sliceStart, beH, beM);

                    const overlapStart = breakStart > sliceStart ? breakStart : sliceStart;
                    const overlapEnd = breakEnd < sliceEnd ? breakEnd : sliceEnd;

                    if (overlapEnd > overlapStart) {
                        minutes -= Math.floor((overlapEnd - overlapStart) / 60000);
                    }
                });
            });

            totalMinutes += Math.max(0, minutes);
        }

        // next day
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
    }

    return totalMinutes;
};

export const isSecondOrFourthSaturday = (dateInput, overrides = []) => {
    // Convert dateInput → Date object safely
    const date =
        dateInput instanceof Date ? dateInput : new Date(dateInput);

    if (isNaN(date.getTime())) {
        console.warn("Invalid date passed to isSecondOrFourthSaturday:", dateInput);
        return false;
    }

    const dateStr = date.toISOString().split("T")[0];

    // If this date is overridden → NOT a holiday
    if (Array.isArray(overrides) && overrides.includes(dateStr)) {
        return false;
    }

    // Not Saturday
    if (date.getDay() !== 6) return false;

    const week = Math.ceil(date.getDate() / 7);

    return week === 2 || week === 4;
};
