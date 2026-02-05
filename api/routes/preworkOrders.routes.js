const express = require('express');
const router = express.Router();
const preworkOrderController = require('../controllers/preworkOrders.controller');
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/preworkOrders.controller');

router.get('/dropdowns', preworkOrderController.getDropdowns);
router.put('/:id',auth,controller.updateWorkOrder);
router.get('/pre-work' ,controller.getWorkOrderList); 
router.get('/work-orders/:id',auth,controller.getWorkOrder);

module.exports = router;
