const express = require('express');

const router = express.Router();

const { signup, login } = require('../controllers/authController');



// Define the endpoints

router.post('/signup', signup);

router.post('/login', login);



module.exports = router;

// In your backend routes file

const { getLiveStatus } = require('../utils/statusHelper');

const User = require('../models/User');



router.get('/student/teachers', async (req, res) => {

    try {

        const teachers = await User.find({ role: 'teacher' });

        const data = teachers.map(t => ({

            name: t.name,

            department: t.department || "General",

            cabin: t.cabin || "Main Block",

            status: getLiveStatus(t) // This calls your statusHelper logic

        }));

        res.json(data);

    } catch (err) {

        res.status(500).json({ message: "Error fetching data" });

    }

}); 

