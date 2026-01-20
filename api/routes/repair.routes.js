const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repair.controller');

router.get('/', repairController.getRepairs);

module.exports = router;
