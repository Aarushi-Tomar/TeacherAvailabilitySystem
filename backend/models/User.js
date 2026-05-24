const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Single Period Slot Schema
const TimetableSlotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true }, // 1 to 10
    startTime: { type: String, required: true },  // e.g., "08:30"
    endTime: { type: String, required: true },    // e.g., "09:20"
    status: { 
        type: String, 
        default: 'Not Available', 
        enum: ['Available', 'In Class', 'Busy', 'Off Campus', 'Not Available'] 
    },
    location: { 
        type: String, 
        default: 'Off Campus' 
    }
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
    cabin: { type: String, default: 'Not Assigned' }, 
    
    // Persists manual status bypass selections from dropdown selectors
    manualStatus: { 
        type: String, 
        enum: ['None', 'Available', 'Busy', 'In Class', 'Off Campus'], 
        default: 'None' 
    },

    // Nested Weekly Matrix array (Only populated for teacher accounts)
    timetable: [DailyScheduleSchema]
}, { timestamps: true });

// 🛠️ UNIFIED PRE-SAVE HOOK: Handles Safe Password Hashing & Timetable Seeding
UserSchema.pre('save', async function(next) {
    // 🔒 SECTION A: SAFE PASSWORD HASHING GUARD
    if (this.isModified('password')) {
        try {
            // Check if it's already a bcrypt hash (starts with $2a$ or $2b$) to prevent double hashing
            if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }
        } catch (err) {
            return next(err);
        }
    }

    // 🔄 SECTION B: AUTOMATIC TEACHER TIMETABLE INITIALIZATION
    if (this.role === 'teacher' && (!this.timetable || this.timetable.length === 0)) {
        const targetDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        const getDailySlotsFactory = () => [
            { slotNumber: 1, startTime: "08:30", endTime: "09:20", status: "Not Available", location: "Off Campus" },
            { slotNumber: 2, startTime: "09:20", endTime: "10:10", status: "Not Available", location: "Off Campus" },
            { slotNumber: 3, startTime: "10:15", endTime: "11:05", status: "Not Available", location: "Off Campus" },
            { slotNumber: 4, startTime: "11:05", endTime: "11:55", status: "Not Available", location: "Off Campus" },
            { slotNumber: 5, startTime: "12:00", endTime: "12:50", status: "Not Available", location: "Off Campus" },
            { slotNumber: 6, startTime: "12:50", endTime: "13:40", status: "Not Available", location: "Off Campus" },
            { slotNumber: 7, startTime: "13:45", endTime: "14:35", status: "Not Available", location: "Off Campus" },
            { slotNumber: 8, startTime: "14:35", endTime: "15:25", status: "Not Available", location: "Off Campus" },
            { slotNumber: 9, startTime: "15:30", endTime: "16:20", status: "Not Available", location: "Off Campus" },
            { slotNumber: 10, startTime: "16:20", endTime: "17:10", status: "Not Available", location: "Off Campus" }
        ];

        this.timetable = targetDays.map(dayName => ({
            day: dayName,
            slots: getDailySlotsFactory()
        }));
    }

    next();
});

module.exports = mongoose.model('User', UserSchema);