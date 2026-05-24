const mongoose = require('mongoose');

const TimetableSlotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true }, // 1 to 10
    startTime: { type: String, required: true },  // e.g., "08:30"
    endTime: { type: String, required: true },    // e.g., "09:20"
    // Added 'Not Available' to support automatic off-hours overrides cleanly
    status: { type: String, default: 'Available', enum: ['Available', 'In Class', 'Busy', 'Off Campus', 'Not Available'] },
    location: { type: String, default: 'Cabin' }  // Dynamic room/lab/cabin
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    department: { type: String, default: 'CSE' },
    
    // The timetable grid array (Only populated for teachers)
    timetable: [TimetableSlotSchema]
}, { timestamps: true });

// Pre-populate default 10 slots when a teacher is created
UserSchema.pre('save', function(next) {
    if (this.role === 'teacher' && this.timetable.length === 0) {
        const defaultSlots = [
            { slotNumber: 1, startTime: "08:30", endTime: "09:20" },
            { slotNumber: 2, startTime: "09:25", endTime: "10:15" },
            { slotNumber: 3, startTime: "10:20", endTime: "11:10" },
            { slotNumber: 4, startTime: "11:15", endTime: "12:05" },
            { slotNumber: 5, startTime: "12:10", endTime: "13:00" },
            { slotNumber: 6, startTime: "13:00", endTime: "13:50" },
            { slotNumber: 7, startTime: "13:55", endTime: "14:45" },
            { slotNumber: 8, startTime: "14:50", endTime: "15:40" },
            { slotNumber: 9, startTime: "15:45", endTime: "16:35" }, // Fixed overlapping typo from 13:45 to 15:45
            { slotNumber: 10, startTime: "16:40", endTime: "17:30" }
        ];
        this.timetable = defaultSlots;
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);
// const mongoose = require('mongoose');

// const TimetableSlotSchema = new mongoose.Schema({
//     slotNumber: { type: Number, required: true }, // 1 to 10
//     startTime: { type: String, required: true },  // e.g., "08:30"
//     endTime: { type: String, required: true },    // e.g., "09:20"
//     status: { type: String, default: 'Available', enum: ['Available', 'In Class', 'Busy', 'Off Campus'] },
//     location: { type: String, default: 'Cabin' }  // Dynamic room/lab/cabin
// });

// const UserSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ['student', 'teacher'], required: true },
//     department: { type: String, default: 'CSE' },
    
//     // The timetable grid array (Only populated for teachers)
//     timetable: [TimetableSlotSchema]
// }, { timestamps: true });

// // Pre-populate default 10 slots when a teacher is created
// UserSchema.pre('save', function(next) {
//     if (this.role === 'teacher' && this.timetable.length === 0) {
//         const defaultSlots = [
//             { slotNumber: 1, startTime: "08:30", endTime: "09:20" },
//             { slotNumber: 2, startTime: "09:25", endTime: "10:15" },
//             { slotNumber: 3, startTime: "10:20", endTime: "11:10" },
//             { slotNumber: 4, startTime: "11:15", endTime: "12:05" },
//             { slotNumber: 5, startTime: "12:10", endTime: "13:00" },
//             { slotNumber: 6, startTime: "13:00", endTime: "13:50" },
//             { slotNumber: 7, startTime: "13:55", endTime: "14:45" },
//             { slotNumber: 8, startTime: "14:50", endTime: "15:40" },
//             { slotNumber: 9, startTime: "13:45", endTime: "16:35" },
//             { slotNumber: 10, startTime: "16:40", endTime: "17:30" }
//         ];
//         this.timetable = defaultSlots;
//     }
//     next();
// });

// module.exports = mongoose.model('User', UserSchema);