const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fetch all teachers with live calculated statuses and locations
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

        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const now = new Date();
        
        // Convert to Indian Standard Time (IST) 24-hour format
        const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' };
        const currentTimeStr = now.toLocaleTimeString('en-US', options); 
        let currentDayName = daysOfWeek[now.getDay()]; 

        // Core college operational hours boundary check
        const isOutsideCollegeHours = (currentTimeStr < "08:30" || currentTimeStr > "17:10");

        const liveFacultyList = teachers.map(teacher => {
            let currentStatus = "Off Campus";
            let currentLocation = "Off Campus";

            const todaysSchedule = (teacher.timetable && teacher.timetable[currentDayName]) ? teacher.timetable[currentDayName] : [];

            // Find if there's a slot running right now
            const activeSlot = todaysSchedule.find(slot => {
                return currentTimeStr >= slot.startTime && currentTimeStr < slot.endTime;
            });

            // Only show active database updates if we are within operational hours
            if (activeSlot && !isOutsideCollegeHours) {
                currentStatus = activeSlot.status || "Off Campus";
                currentLocation = activeSlot.location || "Cabin";
            }

            // 🎯 FORCED GRID BACKEND OVERRIDE: 
            // If it's night/weekend, map every single row to "Not Available" and "Off Campus"
            const processedTimetable = todaysSchedule.map(slot => {
                if (isOutsideCollegeHours) {
                    return {
                        ...slot._doc,
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