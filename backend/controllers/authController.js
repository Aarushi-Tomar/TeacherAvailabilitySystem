const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Using bcryptjs for better compatibility
const jwt = require('jsonwebtoken');

// ========================
// 1. SIGNUP LOGIC
// ========================
exports.signup = async (req, res) => {
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

        // Check if user already exists
        let user = await User.findOne({ email: emailLower });
        if (user) {
            return res.status(400).json({ message: "User already exists" }); 
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save new user matching your 7-day nested database structure
        user = new User({
            name,
            email: emailLower,
            password: hashedPassword,
            role
        });

        await user.save();
        res.status(201).json({ message: "Account created successfully! Please log in." });

    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ message: "Server error during signup", error: err.message });
    }
};

// ========================
// 2. REINFORCED LOGIN LOGIC
// ========================
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "Please enter all fields including your designated role." });
        }

        const emailLower = email.toLowerCase().trim();

        // 1. Check if user exists
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

        // 🛑 DOMAIN SECURITY HARDENING: Extra validation check against altered database documents
        if (user.role === 'teacher' && !emailLower.endsWith('@teacher.edu')) {
            return res.status(403).json({ message: "Access Denied: Invalid account credentials structure." });
        }
        if (user.role === 'student' && !emailLower.endsWith('@student.edu')) {
            return res.status(403).json({ message: "Access Denied: Invalid account credentials structure." });
        }

        // 2. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // 3. Fallback Key Security Check
        const secretKey = process.env.JWT_SECRET || 'aarushi_secret_key_2026';

        // 4. Generate genuine secure JWT authorization token (24 Hour Active Lifespan)
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            secretKey,
            { expiresIn: '24h' }
        );

        // 5. Send consolidated object state properties
        res.status(200).json({
            message: "Login successful!",
            token,
            role: user.role
        });

    } catch (err) {
        console.error("FULL LOGIN ERROR LOG:", err);
        res.status(500).json({
            message: "Server error during login",
            error: err.message
        });
    }
};

// ===================================
// 3. 🔑 FORGOT PASSWORD CONTROLLER LOGIC
// ===================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required." });
        }

        const emailLower = email.toLowerCase().trim();

        // Locate target document
        const user = await User.findOne({ email: emailLower });
        if (!user) {
            return res.status(404).json({ message: "No account found with this email address." });
        }

        // Hash the new password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Apply override updates cleanly
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password updated successfully! You can now log in with your new password." });

    } catch (err) {
        console.error("FORGOT PASSWORD CONTROLLER ERROR:", err);
        res.status(500).json({ message: "Server error during password override update.", error: err.message });
    }
};

