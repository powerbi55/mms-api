require('dotenv').config();

const express = require('express');
const app = express();

///ใช้ login 
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // หรือ port frontend
  credentials: true
}));
///จบ login

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./jobs/sync-sheet.job');

// routes
app.use('/api', require('./routes/sync.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/prework-orders', require('./routes/preworkOrders.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
