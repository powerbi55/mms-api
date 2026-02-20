require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

///ใช้ login 
const cors = require('cors');

app.use(cors({
  origin: 'http://172.16.12.101:5173', // หรือ port frontend
  credentials: true
}));
///จบ login

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files สำหรับรูปภาพที่ upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

require('./jobs/sync-sheet.job');

// routes
app.use('/api', require('./routes/sync.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/prework-orders', require('./routes/preworkOrders.routes'));
app.use('/api/activity-orders', require('./routes/Activityworkorders.routes'));

// // Image routes (nested under activity-orders)
app.use('/api/activity-orders/:id/images', require('./routes/imageFiles.routes'));

// Historycal Work Orders (read-only)
app.use('/api/historical-orders', require('./routes/Historicalworkorders.routes'));

// // Image routes สำหรับ Historical (GET only — ใช้ไฟล์ routes เดิมร่วมกันได้เลย)
app.use('/api/historical-orders/:id/images', require('./routes/imageFiles.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});