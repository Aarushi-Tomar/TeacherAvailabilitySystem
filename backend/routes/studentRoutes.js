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

        // Fetch all users whose role is 'teacher'
        const teachers = await User.find({ role: 'teacher' }).select('-password');

        // Map system getDay() indexes to our precise database Day strings
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const now = new Date();
        
        // Convert local time explicitly to Indian Standard Time (IST) 24-hour format
        const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' };
        const currentTimeStr = now.toLocaleTimeString('en-US', options); 
        const currentDayName = daysOfWeek[now.getDay()]; 

        // Core college operational hours bounds
        const isOutsideCollegeHours = (currentTimeStr < "08:30" || currentTimeStr > "17:10");
        const isSunday = (currentDayName === 'Sunday');

        const liveFacultyList = teachers.map(teacher => {
            let currentStatus = "Off Campus";
            let currentLocation = "Off Campus";

            // 🔍 Locate the sub-document day matching today's calendar item in the new matrix structure
            const dayDocument = teacher.timetable ? teacher.timetable.find(t => t.day === currentDayName) : null;
            const todaysSlots = dayDocument ? dayDocument.slots : [];

            // Find if a timed block is actively running right now
            const activeSlot = todaysSlots.find(slot => {
                return currentTimeStr >= slot.startTime && currentTimeStr < slot.endTime;
            });

            if (isOutsideCollegeHours || isSunday) {
                currentStatus = "Not Available";
                currentLocation = "Off Campus";
            } else if (activeSlot) {
                // We are inside an active class period! Pull dynamic data
                currentStatus = activeSlot.status || "Available";
                currentLocation = activeSlot.location || "Cabin";
            } else {
                // 🕒 PASSING BREAK DETECTED: 
                // We are inside college hours, but no period matches current minutes (e.g. 5-min passing gap)
                currentStatus = "In Break";
                currentLocation = "Passing Corridor";
            }

            // Map and return the complete schedule matrix array structure for the frontend UI tabs
            // If it's night or Sunday, pre-format the feedback array so students see the forced static rules instantly
            const processedTimetable = teacher.timetable.map(dayGroup => {
                return {
                    day: dayGroup.day,
                    slots: dayGroup.slots.map(slot => {
                        if (isOutsideCollegeHours || isSunday) {
                            return {
                                ...slot._doc,
                                status: "Not Available",
                                location: "Off Campus"
                            };
                        }
                        return slot;
                    })
                };
            });

            return {
                _id: teacher._id,
                name: teacher.name,
                department: teacher.department || 'CSE',
                status: currentStatus,
                cabin: teacher.cabin || currentLocation, // Uses custom designated fallback cabin if assigned
                liveLocation: currentLocation,           // The dynamic running coordinate
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