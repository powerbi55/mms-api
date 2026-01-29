const express = require('express');
const router = express.Router();

// middleware
const auth = require('../middleware/auth.middleware');
const admin = require('../middleware/admin.middleware');

// controllers
const userController = require('../controllers/user.controller');


router.post('/admin', auth, admin, userController.createUserByAdmin);
router.put('/change-password', auth, userController.changeMyPassword);
router.put('/:user_id', auth, admin, userController.updateUser);

//ดึงชื่อเมื่อ login
router.get('/me', auth, userController.getMe);

module.exports = router;
