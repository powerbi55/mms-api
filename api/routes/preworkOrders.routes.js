const express = require('express');
const router = express.Router();

const controller = require('../controllers/preworkOrders.controller');
const auth = require('../middleware/auth.middleware');

// =========================
// Dropdowns (master data)
// =========================
router.get('/dropdowns', auth, controller.getMasters);

// =========================
// Pre-work list
// =========================
router.get('/prework-list', auth, controller.getWorkOrderList);

// =========================
// Get work order by id
// =========================
router.get('/:id', auth, controller.getWorkOrder);

// =========================
// Update work order
// =========================
router.put('/:id', auth, controller.updateWorkOrder);

module.exports = router;