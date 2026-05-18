const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

require('dotenv').config({ path: './.env' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Debug middleware
app.use((req, res, next) => {
    console.log("Incoming Request:", req.method, req.url);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Fallback route (VERY IMPORTANT)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🚀 Connected to MongoDB Atlas!"))
    .catch((err) => console.log("❌ DB Connection Error:", err));

// Port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// const dns = require("dns");
// dns.setDefaultResultOrder("ipv4first");
// require('dotenv').config({ path: './.env' });
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();

// // Middleware
// app.use(express.json());
// app.use(cors());

// // Database Connection
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log("🚀 Connected to MongoDB Atlas!"))
//     .catch((err) => console.log("❌ DB Connection Error:", err));

// const PORT = process.env.PORT || 5000;
// // Import the routes
// const authRoutes = require('./routes/authRoutes');
// app.use((req, res, next) => {
//     console.log("Incoming Request:", req.method, req.url);
//     next();
// });
// // Use the routes
// app.use('/api/auth', authRoutes);
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });
// const path = require("path");

// app.use(express.static(path.join(__dirname, "../public")));