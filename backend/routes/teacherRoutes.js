const express = require('express');

const router = express.Router();

const mongoose = require('mongoose');

const User = mongoose.model('User');

// Note: You should ideally add your JWT verification middleware here later



// Save/Update full timetable

router.post('/update-timetable', async (req, res) => {

    try {

        const { email, updatedTimetable } = req.body; // Using email to identify for now



        const teacher = await User.findOne({ email, role: 'teacher' });

        if (!teacher) {

            return res.status(404).json({ message: "Teacher account not found" });

        }



        // Replace old timetable data with updates from the portal layout

        teacher.timetable = updatedTimetable;

        await teacher.save();



        res.status(200).json({ message: "Timetable schedule updated successfully!" });

    } catch (err) {

        console.error(err);

        res.status(500).json({ message: "Failed to update schedule" });

    }

});



module.exports = router; 

