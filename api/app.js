require('dotenv').config();
const express = require('express');
const app = express();
const repairRoutes = require('./routes/repair.routes');
const preworkOrdersRoutes = require('./routes/preworkOrders.routes');

app.use(express.json());

app.use('/api', require('./routes/sync.routes'));
app.use('/api/repairs', require(repairRoutes));
app.use('/api/work-orders', require(preworkOrdersRoutes));

module.exports = app;
