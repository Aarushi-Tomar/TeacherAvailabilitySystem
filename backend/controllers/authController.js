const User = require('../models/User');

const bcrypt = require('bcryptjs'); // Using bcryptjs for better compatibility[cite: 2, 5]

const jwt = require('jsonwebtoken');



// SIGNUP LOGIC

exports.signup = async (req, res) => {

    try {

        const { name, email, password, role } = req.body;



        // Check if user already exists

        let user = await User.findOne({ email });

        if (user) {

            return res.status(400).json({ message: "User already exists" }); //[cite: 5]

        }



        // Hash the password

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);



        // Create and save new user

        user = new User({

            name,

            email,

            password: hashedPassword,

            role

        });



        await user.save();

        res.status(201).json({ message: "User registered successfully!" }); //[cite: 5]



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



        // 1. Check if user exists[cite: 5]

        const user = await User.findOne({ email });

        console.log("USER:", user);  

        if (!user) {

            return res.status(400).json({ message: "Invalid Credentials" });

        }



        // 2. Compare passwords[cite: 5]

        const isMatch = await bcrypt.compare(password, user.password);

       

        if (!isMatch) {

            return res.status(400).json({ message: "Invalid Credentials" });

        }



        // 3. Check for JWT_SECRET[cite: 1, 5]

        if (!process.env.JWT_SECRET) {

            console.error("CRITICAL ERROR: JWT_SECRET is missing from .env file");

            return res.status(500).json({ message: "Internal server configuration error" });

        }



        // 4. Generate JWT Token[cite: 5]

        const token = jwt.sign(

            { id: user._id, role: user.role },

            process.env.JWT_SECRET,

            { expiresIn: '1h' }

        );



        // 5. Send response[cite: 5]

        res.status(200).json({

            message: "Login successful!",

            token,

            role: user.role

        });



    } catch (err) {

        // Detailed error logging for the terminal[cite: 5]

        console.error("FULL LOGIN ERROR LOG:", err);

        res.status(500).json({

            message: "Server error during login",

            error: err.message

        });

    }

}; 

