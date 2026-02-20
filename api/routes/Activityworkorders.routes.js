// activityWorkOrders.routes.js
const express = require('express');
const router = express.Router();

const controller = require('../controllers/Activityworkorders.controller');
const auth = require('../middleware/auth.middleware');

// =========================
// Master Data (dropdowns)
// =========================
router.get('/dropdowns', auth, controller.getActivityMasters);

// =========================
// Active Work Order List
// =========================
router.get('/list', auth, controller.getActiveWorkOrderList);

// =========================
// Get work order by id
// =========================
router.get('/:id', auth, controller.getActivityWorkOrder);

// =========================
// Get activities by work order id
// =========================
router.get('/:id/activities', auth, controller.getActivities);

// =========================
// Update work order (General Tab)
// =========================
router.put('/:id', auth, controller.updateActivityWorkOrder);

// =========================
// Update preparations (Prepare Tab)
// =========================
router.put('/:id/preparations', auth, controller.updatePreparations);

// =========================
// Add activity (Activity Tab)
// =========================
router.post('/:id/activities', auth, controller.addActivity);

// =========================
// Delete activity
// =========================
router.delete('/:id/activities/:activityId', auth, controller.deleteActivity);

// =========================
// Update job status only
// =========================
router.put('/:id/status', auth, controller.updateJobStatus);

// =========================
// Update report (Report Tab)
// =========================
router.put('/:id/report', auth, controller.updateReport);

module.exports = router;