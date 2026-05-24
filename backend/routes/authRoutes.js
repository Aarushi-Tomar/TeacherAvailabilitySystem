const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { signup, login } = require('../controllers/authController');
const User = require('../models/User');

// 🎯 ENDPOINT: SIGNUP (With strict institutional alphabet email pattern matching)
router.post('/signup', (req, res, next) => {
    const { email, role } = req.body;

    if (!email || !role) {
        return res.status(400).json({ message: "All fields are required to process registration." });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Enforce that username strings MUST start with an alphabet letter, blocking numbers-only entry points
    const studentRegex = /^[a-zA-Z][a-zA-Z0-9._]*@student\.edu$/;
    const teacherRegex = /^[a-zA-Z][a-zA-Z0-9._]*@teacher\.edu$/;

    if (role === 'student' && !studentRegex.test(cleanEmail)) {
        return res.status(400).json({ message: "Invalid email format. Student usernames must start with letters (e.g., aarushi9@student.edu)." });
    }

    if (role === 'teacher' && !teacherRegex.test(cleanEmail)) {
        return res.status(400).json({ message: "Invalid email format. Teacher usernames must start with letters." });
    }

    // If input formats match institutional standards, hand off execution to your existing authController
    signup(req, res, next);
});

// 🎯 ENDPOINT: LOGIN
router.post('/login', login);

// 🎯 ENDPOINT: SIMPLIFIED FORGOT PASSWORD DIRECT EMAIL INTERFACE
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Both institutional email and new password inputs are required." });
        }

        // Find matching profile instance in MongoDB
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ message: "No account profile matched that email record." });
        }

        // Securely encrypt the replacement password string via bcrypt
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Commit updates back into MongoDB storage collection instance
        await user.save();

        res.status(200).json({ message: "Password updated successfully! Proceed back to login." });
    } catch (err) {
        console.error("Forgot password API routine exception:", err);
        res.status(500).json({ message: "Internal application error processing credentials shift." });
    }
});

module.exports = router;