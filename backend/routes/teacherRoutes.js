const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// ==========================================
// 🔄 1. SAVE / UPDATE WEEKLY TIMETABLE MATRIX
// ==========================================
router.post('/update-timetable', async (req, res) => {
    try {
        const { email, updatedTimetable, singleDay } = req.body; 

        const teacher = await User.findOne({ email, role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher account not found" });
        }

        // 💡 APPROACH A: Individual single day data mutations
        if (singleDay && Array.isArray(updatedTimetable)) {
            const dayDoc = teacher.timetable.find(t => t.day.toLowerCase() === singleDay.toLowerCase());
            if (dayDoc) {
                dayDoc.slots = updatedTimetable;
            } else {
                teacher.timetable.push({ day: singleDay, slots: updatedTimetable });
            }
        } 
        // 💡 APPROACH B: Bulk 7-day layout saves
        else if (Array.isArray(updatedTimetable)) {
            teacher.timetable = updatedTimetable;
        } 
        else {
            return res.status(400).json({ message: "Invalid timetable data format received." });
        }

        await teacher.save();
        res.status(200).json({ message: "Timetable schedule updated successfully!" });

    } catch (err) {
        console.error("Teacher timetable update matrix error:", err);
        res.status(500).json({ message: "Failed to update your academic schedule." });
    }
});

// ==========================================
// 🏢 2. UPDATE QUICK GLOBAL CABIN BASE
// ==========================================
router.post('/update-cabin', async (req, res) => {
    try {
        const { email, cabin } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email identifier parameter missing." });
        }

        const teacher = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim(), role: 'teacher' },
            { $set: { cabin: cabin } },
            { new: true } // Returns the newly modified object state document
        );

        if (!teacher) {
            return res.status(404).json({ message: "Faculty profile not found to process updates." });
        }

        res.status(200).json({ message: "Base Cabin location successfully updated!" });
    } catch (err) {
        console.error("Global Cabin Update Error:", err);
        res.status(500).json({ message: "Server fault processing base cabin changes." });
    }
});

// ==========================================
// ⚡ 3. UPDATE MANUAL OVERRIDE STATUS 
// ==========================================
router.post('/update-status', async (req, res) => {
    try {
        const { email, manualStatus } = req.body;

        if (!email || !manualStatus) {
            return res.status(400).json({ message: "Missing tracking payload parameters." });
        }

        const teacher = await User.findOneAndUpdate(
            { email: email.toLowerCase().trim(), role: 'teacher' },
            { $set: { manualStatus: manualStatus } }, // Syncs directly with dropdown inputs
            { new: true }
        );

        if (!teacher) {
            return res.status(404).json({ message: "Faculty profile not found to process overrides." });
        }

        res.status(200).json({ message: "Global manual override rule successfully applied!" });
    } catch (err) {
        console.error("Manual Status Override Error:", err);
        res.status(500).json({ message: "Server fault applying immediate live priority filters." });
    }
});

// ==========================================
// 🔍 4. FETCH TEACHER'S OWN CURRENT PROFILE MATRIX
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
            manualStatus: teacher.manualStatus || 'None', // Ensure frontend receives data to match dropdown select tag
            timetable: teacher.timetable 
        });
    } catch (err) {
        console.error("Error retrieving teacher dashboard layout:", err);
        res.status(500).json({ message: "Server fault retrieving your profile database." });
    }
});

module.exports = router;