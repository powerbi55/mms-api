require('dotenv').config();
const express = require('express');
const app = express();
const sheetRoutes = require('./routes/sheet.routes');

app.use(express.json());
app.use('/api/sheet', require('./routes/sheet.routes'));
app.use('/api/sheet', sheetRoutes);

module.exports = app;
