const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper middleware to protect teacher routes and verify tokens safely
const verifyTeacherToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Access denied. Token missing." });
        }
        const token = authHeader.split(' ')[1];
        // Decodes token using your application secret key string
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aarushi_secret_key_2026');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired session token." });
    }
};

// ==========================================
// 🔄 1. UPDATE TEACHER TIMETABLE ROUTE
// ==========================================
// URL: /api/teacher/update-timetable
router.post('/update-timetable', verifyTeacherToken, async (req, res) => {
    try {
        const { email, day, slots } = req.body;

        if (!email || !day || !slots) {
            return res.status(400).json({ message: "Missing required matrix update parameters." });
        }

        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Faculty baseline profile not found." });
        }

        const dayIndex = teacher.timetable.findIndex(t => t.day === day);
        if (dayIndex !== -1) {
            teacher.timetable[dayIndex].slots = slots;
        } else {
            teacher.timetable.push({ day, slots });
        }

        await teacher.save();
        res.status(200).json({ message: "Academic schedule matrix synced successfully!" });
    } catch (err) {
        console.error("Timetable update fault:", err);
        res.status(500).json({ message: "Server encountered a fault updating the schedule." });
    }
});

// ==========================================
// 🏢 2. UPDATE CABIN ROUTE (FIXED PATH FOR 404)
// ==========================================
// URL: /api/teacher/update-cabin
router.post('/update-cabin', verifyTeacherToken, async (req, res) => {
    try {
        const { email, cabin } = req.body;

        if (!email || !cabin) {
            return res.status(400).json({ message: "Email and cabin selection values are required." });
        }

        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Faculty profile not found." });
        }

        teacher.cabin = cabin;
        await teacher.save();

        res.status(200).json({ message: "Base cabin location successfully updated!" });
    } catch (err) {
        console.error("Cabin update fault:", err);
        res.status(500).json({ message: "Failed to update base cabin coordinate." });
    }
});

// ==========================================
// ⚡ 3. UPDATE MANUAL OVERRIDE STATUS ROUTE (FIXED PATH FOR 404)
// ==========================================
// URL: /api/teacher/update-status
router.post('/update-status', verifyTeacherToken, async (req, res) => {
    try {
        const { email, manualStatus } = req.body;

        if (!email || !manualStatus) {
            return res.status(400).json({ message: "Email and status control targets are required." });
        }

        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Faculty profile not found." });
        }

        teacher.manualStatus = manualStatus;
        await teacher.save();

        res.status(200).json({ message: "Global manual override rule successfully applied!" });
    } catch (err) {
        console.error("Status override fault:", err);
        res.status(500).json({ message: "Failed to apply temporary status override request." });
    }
});

// ==========================================
// 🔍 4. FETCH SINGLE TEACHER TIMETABLE
// ==========================================
// URL: /api/teacher/my-timetable
router.get('/my-timetable', verifyTeacherToken, async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: "Teacher email parameter required." });
        }

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