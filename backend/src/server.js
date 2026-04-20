const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route Imports
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const guardRoutes = require('./routes/guardRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const app = express();

// --- Middlewares ---
app.use(cors()); // ለዌብ ዳሽቦርዱ ከባክኤንድ ጋር እንዲገናኝ ይፈቅዳል
app.use(express.json()); // JSON ዳታ ለመቀበል
app.use(express.urlencoded({ extended: true }));

// --- Request Logging (ለዲባግ ይረዳል) ---
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} to ${req.url}`);
    next();
});

// --- API Routes ---
app.use('/api/v1/auth', authRoutes); 
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/guard', guardRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
// --- Health Check ---
app.get('/', (req, res) => {
    res.json({
        status: "Online",
        message: "SmartClear Enterprise API is running smoothly",
        version: "1.0.0",
        developed_by: "DEVVOLTZ"
    });
});

// --- 404 Handler (ያልተፈጠሩ Routeዎች ሲጠሩ) ---
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `የጠየቁት መንገድ (${req.originalUrl}) አልተገኘም። እባክዎ URL በትክክል መጻፉን ያረጋግጡ።`
    });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "የውስጥ ሰርቨር ስህተት አጋጥሟል"
    });
});

const PORT = process.env.PORT || 5000;

// ሰርቨሩ ሲጀምር በሁሉም Network Interface ላይ እንዲሰማ ማድረግ
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 ==========================================
    🔥 SmartClear Enterprise Backend Started!
    📡 Port: ${PORT}
    🌐 Local: http://localhost:${PORT}
    🛠  Status: Ready for DEVVOLTZ Ecosystem
    =============================================
    `);
});