const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Using bcryptjs for better compatibility
const jwt = require('jsonwebtoken');

// SIGNUP LOGIC
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Clean the email string inputs to prevent duplicate mismatch profiles
        const cleanEmail = email.toLowerCase().trim();

        // Check if user already exists
        let user = await User.findOne({ email: cleanEmail });
        if (user) {
            return res.status(400).json({ message: "User already exists" }); 
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save new user
        user = new User({
            name,
            email: cleanEmail,
            password: hashedPassword,
            role
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully!" }); 

    } catch (err) {
        console.error("Signup Error:", err.message);
        res.status(500).json({ message: "Server error during signup", error: err.message });
    }
};

// LOGIN LOGIC
exports.login = async (req, res) => {
    try {
        console.log("REQ BODY:", req.body);
        const { email, password } = req.body;

        // Clean the input to ensure case-insensitive email processing matches MongoDB
        const cleanEmail = email.toLowerCase().trim();

        // 1. Check if user exists
        const user = await User.findOne({ email: cleanEmail });
        console.log("USER:", user);  
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // 2. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        // 3. Check for JWT_SECRET fallback fallback key string pattern
        const secretKey = process.env.JWT_SECRET || 'aarushi_secret_key_2026';
        if (!process.env.JWT_SECRET) {
            console.warn("WARNING: JWT_SECRET missing from environment variables, utilizing local fallback.");
        }

        // 4. Generate JWT Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            secretKey,
            { expiresIn: '24h' } // Increased to 24h to avoid student portal session timeouts during testing
        );

        // 5. Send response with dynamic tracking variables
        res.status(200).json({
            message: "Login successful!",
            token,
            role: user.role,
            email: user.email // Passed down so frontends can cross-reference active user storage states easily
        });

    } catch (err) {
        console.error("FULL LOGIN ERROR LOG:", err);
        res.status(500).json({ 
            message: "Server error during login", 
            error: err.message 
        });
    }
};