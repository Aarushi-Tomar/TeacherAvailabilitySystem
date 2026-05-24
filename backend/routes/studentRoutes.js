const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// GET all faculty with dynamic timetable calculations
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).select('-password');

        // Calculate Current Time details in Indian Standard Time (IST)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; 
        const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
        
        const currentHour = istTime.getHours();
        const currentMinute = istTime.getMinutes();
        const totalMinutesNow = (currentHour * 60) + currentMinute;

        // Campus Operational Bounds (08:30 AM to 05:10 PM / 17:10)
        const campusStart = (8 * 60) + 30; 
        const campusEnd = (17 * 60) + 10;  

        // Determine if current execution is completely outside operating boundaries
        const isOutsideCollegeHours = (totalMinutesNow < campusStart || totalMinutesNow > campusEnd);

        const dynamicTeachers = teachers.map(teacher => {
            let currentStatus = 'Off Campus';
            let currentLocation = 'Off Campus';

            // Check if the current time is inside college hours
            if (!isOutsideCollegeHours) {
                let foundActiveSlot = false;

                // Loop through the 10 slots to find the active period
                for (let slot of teacher.timetable) {
                    const [startH, startM] = slot.startTime.split(':').map(Number);
                    const [endH, endM] = slot.endTime.split(':').map(Number);
                    
                    const slotStartMins = (startH * 60) + startM;
                    const slotEndMins = (endH * 60) + endM;

                    if (totalMinutesNow >= slotStartMins && totalMinutesNow < slotEndMins) {
                        currentStatus = slot.status;
                        currentLocation = slot.location;
                        foundActiveSlot = true;
                        break;
                    }
                }

                // If inside college hours but matching NO slot, it's a passing break period!
                if (!foundActiveSlot) {
                    currentStatus = 'In Break';
                    currentLocation = 'Moving to Next Lecture';
                }
            }

            // 🎯 FORCED GRID OVERRIDE: 
            // If it is late night/weekend, map every row item to safe offline modes
            const processedTimetable = teacher.timetable.map(slot => {
                if (isOutsideCollegeHours) {
                    return {
                        _id: slot._id,
                        slotNumber: slot.slotNumber,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        status: "Not Available",
                        location: "Off Campus"
                    };
                }
                return slot;
            });

            return {
                _id: teacher._id,
                name: teacher.name,
                department: teacher.department || 'CSE',
                status: currentStatus,
                cabin: currentLocation, 
                fullTimetable: processedTimetable // 🎯 Passed down so frontend dropdown can loop through it!
            };
        });

        res.status(200).json(dynamicTeachers);
    } catch (err) {
        console.error("Student side view processing error:", err);
        res.status(500).json({ message: "Error tracking live data" });
    }
});

module.exports = router;