// Historicalworkorders.routes.js
// Read-only routes — ไม่มี PUT / POST / DELETE
const express = require('express');
const router = express.Router();

const controller = require('../controllers/Historicalworkorders.controller');
const auth = require('../middleware/auth.middleware');

// =========================
// Master Data (dropdowns)
// =========================
router.get('/dropdowns', auth, controller.getHistoricalMasters);

// =========================
// Historical Work Order List (Completed)
// =========================
router.get('/list', auth, controller.getHistoricalWorkOrderList);

// =========================
// Get work order by id (ต้องเป็น Completed เท่านั้น)
// =========================
router.get('/:id', auth, controller.getHistoricalWorkOrder);

// =========================
// Get activities by work order id (read-only)
// =========================
router.get('/:id/activities', auth, controller.getHistoricalActivities);

module.exports = router;