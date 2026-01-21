const express = require('express');
const router = express.Router();

// middleware
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// controllers
const userController = require('../controllers/user.controller');


router.post('/admin', auth, admin, userController.createUserByAdmin);


router.put('/:user_id', auth, admin, userController.updateUser);


module.exports = router;
