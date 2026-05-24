const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fetch all teachers with live calculated statuses and locations matching the 7-day matrix
router.get('/teachers', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access denied. Missing token." });
        }

        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET || 'aarushi_secret_key_2026');

        const teachers = await User.find({ role: 'teacher' }).select('-password');

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        
        const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' };
        const currentTimeStr = now.toLocaleTimeString('en-US', options); 
        const currentDayName = daysOfWeek[now.getDay()]; // e.g., "Mon"

        const isOutsideCollegeHours = (currentTimeStr < "08:30" || currentTimeStr > "17:10");
        const isSunday = (currentDayName === 'Sun');

        const liveFacultyList = teachers.map(teacher => {
            let currentStatus = "Not Available";
            let currentLocation = "Off Campus";

            // 1. Check if there's an active global manual override rule set by the teacher first
            if (teacher.manualStatus && teacher.manualStatus !== "None") {
                currentStatus = teacher.manualStatus;
                currentLocation = (teacher.manualStatus === "Off Campus") ? "Off Campus" : (teacher.cabin || "Main Cabin");
            } 
            // 2. If it is Sunday or outside working hours, default to Not Available
            else if (isOutsideCollegeHours || isSunday) {
                currentStatus = "Not Available";
                currentLocation = "Off Campus";
            } 
            // 3. Within working hours: inspect the timetable arrays to grab the active block slot
            else {
                const dayDocument = teacher.timetable ? teacher.timetable.find(t => t.day === currentDayName) : null;
                const todaysSlots = dayDocument ? dayDocument.slots : [];

                const activeSlot = todaysSlots.find(slot => {
                    return currentTimeStr >= slot.startTime && currentTimeStr < slot.endTime;
                });

                if (activeSlot) {
                    currentStatus = slot.status || "Not Available";
                    currentLocation = slot.location || "Off Campus";
                } else {
                    // Default fallback if time is within college hours but explicitly unconfigured or a break slot
                    currentStatus = "Not Available";
                    currentLocation = "Off Campus";
                }
            }

            // 🌟 FIXED: Keep the pristine, full schedule untouched so students can view the layout anytime!
            const processedTimetable = teacher.timetable.map(dayGroup => {
                return {
                    day: dayGroup.day,
                    slots: dayGroup.slots.map(slot => {
                        return {
                            slotNumber: slot.slotNumber,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            status: slot.status,
                            location: slot.location
                        };
                    })
                };
            });

            return {
                _id: teacher._id,
                name: teacher.name,
                department: teacher.department || 'CSE',
                status: currentStatus,
                cabin: teacher.cabin || "Not Assigned", 
                liveLocation: currentLocation,           
                fullTimetable: processedTimetable 
            };
        });

        res.status(200).json(liveFacultyList);
    } catch (err) {
        console.error("Student portal tracking fetch error:", err);
        res.status(500).json({ message: "Failed to pull live faculty listings due to a server fault." });
    }
});

module.exports = router;