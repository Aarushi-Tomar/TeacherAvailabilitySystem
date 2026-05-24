const mongoose = require('mongoose');

// Single Period Slot Schema
const TimetableSlotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true }, // 1 to 10
    startTime: { type: String, required: true },  // e.g., "08:30"
    endTime: { type: String, required: true },    // e.g., "09:20"
    status: { 
        type: String, 
        default: 'Available', 
        enum: ['Available', 'In Class', 'Busy', 'Off Campus', 'Not Available'] 
    },
    location: { type: String, default: 'Cabin' }  // Dynamic room/lab/cabin venue tracking
});

// Daily Wrapper Schema to construct the Weekly Matrix
const DailyScheduleSchema = new mongoose.Schema({
    day: { 
        type: String, 
        required: true, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
    },
    slots: [TimetableSlotSchema]
});

// Main Core User Collection Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    department: { type: String, default: 'CSE' },
    cabin: { type: String, default: 'Not Assigned' }, // Global anchor state backup tracker

    // 🔄 Nested Weekly Matrix array (Only populated for teacher accounts)
    timetable: [DailyScheduleSchema]
}, { timestamps: true });

// 🛠️ PRE-POPULATE HOOK: Automatically seeds all 7 days with your 10 unique time blocks
UserSchema.pre('save', function(next) {
    if (this.role === 'teacher' && this.timetable.length === 0) {
        const targetDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        // Your true institutional 10-period daily execution matrix block
        const getDailySlotsFactory = () => [
            { slotNumber: 1, startTime: "08:30", endTime: "09:20" },
            { slotNumber: 2, startTime: "09:20", endTime: "10:10" },
            { slotNumber: 3, startTime: "10:15", endTime: "11:05" },
            { slotNumber: 4, startTime: "11:05", endTime: "11:55" },
            { slotNumber: 5, startTime: "12:00", endTime: "12:50" },
            { slotNumber: 6, startTime: "12:50", endTime: "13:40" },
            { slotNumber: 7, startTime: "13:45", endTime: "14:35" },
            { slotNumber: 8, startTime: "14:35", endTime: "15:25" },
            { slotNumber: 9, startTime: "15:30", endTime: "16:20" },
            { slotNumber: 10, startTime: "16:20", endTime: "17:10" }
        ];

        // Seed every single tracking calendar day array cleanly
        this.timetable = targetDays.map(dayName => ({
            day: dayName,
            slots: getDailySlotsFactory()
        }));
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);