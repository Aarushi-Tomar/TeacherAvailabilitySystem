const getLiveStatus = (teacher) => {
    // 1. Check Manual Override first
    if (teacher.manualStatus && teacher.manualStatus !== 'None') {
        return teacher.manualStatus;
    }

    // 2. Check Timetable Logic
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
                        now.getMinutes().toString().padStart(2, '0');

    const schedule = teacher.timetable.find(t => t.day === currentDay);
    if (schedule) {
        const slot = schedule.slots.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
        if (slot) return slot.activityType === 'Class' ? 'In Class' : 'Available';
    }

    return 'Available'; // Default
};

module.exports = { getLiveStatus };