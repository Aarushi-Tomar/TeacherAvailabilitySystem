const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// Note: You should ideally add your JWT verification middleware here later

// ==========================================
// 🔄 SAVE / UPDATE WEEKLY TIMETABLE MATRIX
// ==========================================
router.post('/update-timetable', async (req, res) => {
    try {
        const { email, updatedTimetable, singleDay } = req.body; 

        const teacher = await User.findOne({ email, role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher account not found" });
        }

        // 💡 APPROACH A: If the frontend is sending an update for a single specific day (e.g., singleDay: "Monday")
        if (singleDay && Array.isArray(updatedTimetable)) {
            const dayDoc = teacher.timetable.find(t => t.day.toLowerCase() === singleDay.toLowerCase());
            
            if (dayDoc) {
                // Map out and override the 10 slots for just that targeted day
                dayDoc.slots = updatedTimetable;
            } else {
                // Fallback safe push if the day structure didn't exist for some reason
                teacher.timetable.push({ day: singleDay, slots: updatedTimetable });
            }
        } 
        // 💡 APPROACH B: If the frontend dashboard saves the entire 7-day matrix at once
        else if (Array.isArray(updatedTimetable)) {
            teacher.timetable = updatedTimetable;
        } 
        else {
            return res.status(400).json({ message: "Invalid timetable data format received." });
        }

        // Save down to MongoDB to persist changes across system reboots
        await teacher.save();
        res.status(200).json({ message: "Timetable schedule updated successfully!" });

    } catch (err) {
        console.error("Teacher timetable update matrix error:", err);
        res.status(500).json({ message: "Failed to update your academic schedule." });
    }
});

// ==========================================
// 🔍 FETCH TEACHER'S OWN CURRENT PROFILE MATRIX
// ==========================================
router.get('/my-timetable', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ message: "Teacher identification email required." });
        }

        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' }).select('-password');
        if (!teacher) {
            return res.status(404).json({ message: "Faculty records not found." });
        }

        res.status(200).json({
            name: teacher.name,
            department: teacher.department,
            cabin: teacher.cabin,
            timetable: teacher.timetable // Sends back the full 7-day array structure to paint your HTML inputs
        });
    } catch (err) {
        console.error("Error retrieving teacher dashboard layout:", err);
        res.status(500).json({ message: "Server fault retrieving your profile database." });
    }
});

module.exports = router;