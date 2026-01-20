require('dotenv').config();
const express = require('express');
const app = express();
const repairRoutes = require('./routes/repair.routes');

app.use('/repairs', repairRoutes);
app.use(express.json());


module.exports = app;
