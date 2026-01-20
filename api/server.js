require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());

require('./jobs/sync-sheet.job');

const authRoutes = require('./routes/auth.routes');

app.use('/api/repairs', require('./routes/repair.routes'));
app.use('/api', authRoutes);
app.use('/api', require('./routes/sync.routes'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
