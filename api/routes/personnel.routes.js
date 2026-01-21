const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');
const controller = require('../controllers/personnel.controller');

router.put('/:pns_id', auth, admin, controller.updatePersonnel);

module.exports = router;
