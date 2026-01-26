const express = require('express');
const router = express.Router();
const preworkOrderController = require('../controllers/preworkOrders.controller');

router.get('/get/:id', preworkOrderController.getWorkOrder);
router.get('/work-orders-dropdowns', preworkOrderController.getDropdowns);
router.put('/update/:id', preworkOrderController.updateWorkOrder);

module.exports = router;
