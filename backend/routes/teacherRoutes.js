const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');

// SAVE / UPDATE full timetable matrix
router.post('/update-timetable', async (req, res) => {
    try {
        const { email, updatedTimetable } = req.body; 

        // Find the specific teacher profile
        const teacher = await User.findOne({ email: email.toLowerCase().trim(), role: 'teacher' });
        if (!teacher) {
            return res.status(404).json({ message: "Teacher account profile not found." });
        }

        // Server-side structural status alignment validation check
        const allowedStatuses = ['Available', 'In Class', 'Busy', 'Off Campus', 'Not Available'];
        
        for (let slot of updatedTimetable) {
            if (slot.status && !allowedStatuses.includes(slot.status)) {
                return res.status(400).json({ 
                    message: `Invalid status configuration detected: "${slot.status}".` 
                });
            }
        }

        // Replace old timetable data grid with the newly configured slots from the portal frontend layout
        teacher.timetable = updatedTimetable;
        await teacher.save();

        res.status(200).json({ message: "Timetable schedule grid updated successfully!" });
    } catch (err) {
        console.error("Teacher portal matrix save exception:", err);
        res.status(500).json({ message: "Failed to save updated classroom schedule records due to a server fault." });
    }
});

module.exports = router;