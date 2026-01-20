const express = require('express');
const router = express.Router();
const syncController = require('../controllers/sync.controller');

router.post('/sync', syncController.syncNow);

module.exports = router;
