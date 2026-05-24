const express = require('express');

const router = express.Router();

const mongoose = require('mongoose');

const User = mongoose.model('User');



// GET all faculty with dynamic timetable calculations

router.get('/teachers', async (req, res) => {

    try {

        const teachers = await User.find({ role: 'teacher' }).select('-password');



        // Calculate Current Time details in Indian Standard Time (IST)

        const now = new Date();

        const istOffset = 5.5 * 60 * 60 * 1000;

        const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);

       

        const currentHour = istTime.getHours();

        const currentMinute = istTime.getMinutes();

        const totalMinutesNow = (currentHour * 60) + currentMinute;



        // Campus Bounds

        const campusStart = (8 * 60) + 30; // 08:30 AM

        const campusEnd = (17 * 60) + 30;  // 05:30 PM



        const dynamicTeachers = teachers.map(teacher => {

            let currentStatus = 'Off Campus';

            let currentLocation = 'Out of Office';



            // Check if the current time is inside college hours

            if (totalMinutesNow >= campusStart && totalMinutesNow <= campusEnd) {

                let foundActiveSlot = false;



                // Loop through the 10 slots to find the active period

                for (let slot of teacher.timetable) {

                    const [startH, startM] = slot.startTime.split(':').map(Number);

                    const [endH, endM] = slot.endTime.split(':').map(Number);

                   

                    const slotStartMins = (startH * 60) + startM;

                    const slotEndMins = (endH * 60) + endM;



                    if (totalMinutesNow >= slotStartMins && totalMinutesNow <= slotEndMins) {

                        currentStatus = slot.status;

                        currentLocation = slot.location;

                        foundActiveSlot = true;

                        break;

                    }

                }



                // If inside college hours but matching NO slot, it's a 5-minute break period!

                if (!foundActiveSlot) {

                    currentStatus = 'In Break';

                    currentLocation = 'Moving to Next Lecture';

                }

            }



            return {

                _id: teacher._id,

                name: teacher.name,

                department: teacher.department || 'CSE',

                status: currentStatus,

                cabin: currentLocation // Mapping the dynamic location to your frontend's 'cabin' view

            };

        });



        res.status(200).json(dynamicTeachers);

    } catch (err) {

        console.error(err);

        res.status(500).json({ message: "Error tracking live data" });

    }

});



module.exports = router; 

