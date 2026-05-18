const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        // This ensures emails follow the university format
        match: [/@(student|teacher)\.edu$/, 'Please use a valid university email']
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['student', 'teacher'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);


const timetableSchema = new mongoose.Schema({
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    slots: [{
        startTime: String, // e.g., "09:00"
        endTime: String,   // e.g., "10:00"
        activityType: { type: String, enum: ['Class', 'Cabin', 'Lab', 'Meeting'], default: 'Cabin' },
        subject: String,
        room: String
    }]
});

// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['student', 'teacher'], required: true },
//     department: { type: String, default: 'General' },
//     cabin: { type: String, default: 'Not Assigned' },
//     // Advanced Availability Fields
//     manualStatus: { 
//         type: String, 
//         enum: ['None', 'Available', 'Busy', 'In Meeting', 'Off Campus', 'On Leave'], 
//         default: 'None' 
//     },
//     statusExpiry: { type: Date }, // For "Busy Until X Time"
//     timetable: [timetableSchema]
// });

// module.exports = mongoose.model('User', userSchema);