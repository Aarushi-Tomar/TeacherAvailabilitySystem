const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ==========================================
// 🔄 UPDATE TEACHER TIMETABLE ROUTE
// ==========================================
router.post('/update-timetable', async (req, res) => {
    try {
        const { email, day, slots } = req.body; // e.g., day = "Mon"

        if (!email || !day || !slots) {
            return res.status(400).json({ message: "Missing required tracking matrix updates configuration values." });
        }

        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Faculty baseline identity profile not found." });
        }

        // Find the index of the day (e.g., "Mon")
        const dayIndex = teacher.timetable.findIndex(t => t.day === day);
        
        if (dayIndex !== -1) {
            // Overwrite existing slots cleanly
            teacher.timetable[dayIndex].slots = slots;
        } else {
            // Fallback push if day entry doesn't exist
            teacher.timetable.push({ day, slots });
        }

        // Save modifications safely (our updated pre-save hook won't double-hash!)
        await teacher.save();

        res.status(200).json({ message: "Academic schedule matrix synced successfully!" });
    } catch (err) {
        console.error("Teacher timetable update matrix error:", err);
        res.status(500).json({ message: "Server encountered a fault updating the schedule." });
    }
});

// ==========================================
// 🔍 FETCH SINGLE TEACHER TIMETABLE
// ==========================================
router.get('/my-timetable', async (req, res) => {
    try {
        const { email } = req.query;
        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' });
        
        if (!teacher) {
            return res.status(404).json({ message: "Teacher account not found." });
        }

        res.status(200).json({ timetable: teacher.timetable });
    } catch (err) {
        res.status(500).json({ message: "Error pulling academic data matrices." });
    }
});

module.exports = router;