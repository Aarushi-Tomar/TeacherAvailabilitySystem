const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==========================================
// 1. SIGNUP ROUTE
// ==========================================
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const emailLower = email.toLowerCase().trim();

        // 🛑 DOMAIN SECURITY PATCH: Block email-role spoofing cross-contamination
        if (role === 'teacher' && !emailLower.endsWith('@teacher.edu')) {
            return res.status(400).json({ 
                message: "Security violation: Teacher portal registration requires a valid @teacher.edu email address." 
            });
        }

        if (role === 'student' && !emailLower.endsWith('@student.edu')) {
            return res.status(400).json({ 
                message: "Security violation: Student portal registration requires a valid @student.edu email address." 
            });
        }

        const userExists = await User.findOne({ email: emailLower });
        if (userExists) {
            return res.status(400).json({ message: "User already registered" });
        }

        // Pass the raw text down—the schema pre-save handler hashes this securely!
        const newUser = new User({
            name,
            email: emailLower,
            password: password, 
            role
        });

        await newUser.save();
        res.status(201).json({ message: "Account created successfully! Please log in." });
    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// ==========================================
// 2. REINFORCED LOGIN ROUTE
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "Please enter all fields including your designated role." });
        }

        const emailLower = email.toLowerCase().trim();
        const user = await User.findOne({ email: emailLower });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 🛑 CROSS-ROLE PORTAL GUARD RAIL: Verify drop-down choice matches actual DB registration status
        if (user.role !== role) {
            return res.status(403).json({ 
                message: `Access Denied: Your account is registered as a ${user.role.toUpperCase()}. You cannot use the ${role.toUpperCase()} portal.` 
            });
        }

        // 🛑 DOMAIN SECURITY HARDENING: Extra validation check against database document structures
        if (user.role === 'teacher' && !emailLower.endsWith('@teacher.edu')) {
            return res.status(403).json({ message: "Access Denied: Invalid account credentials structure." });
        }
        if (user.role === 'student' && !emailLower.endsWith('@student.edu')) {
            return res.status(403).json({ message: "Access Denied: Invalid account credentials structure." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate secure JWT authorization token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'aarushi_secret_key_2026',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful!",
            token: token,
            role: user.role
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// ==========================================
// 3. 🔑 SECURED FORGOT PASSWORD ROUTE
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required." });
        }

        const emailLower = email.toLowerCase().trim();
        const user = await User.findOne({ email: emailLower });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email address." });
        }

        // Set the raw string. The model's updated .isModified pre-save hook handles the hashing safely.
        user.password = newPassword; 
        await user.save();

        res.status(200).json({ message: "Password updated successfully! You can now log in with your new password." });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ message: "Server error during password override update." });
    }
});

module.exports = router;