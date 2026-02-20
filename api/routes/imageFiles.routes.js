// imageFiles.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams รับ :id จาก parent
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/imageFiles.controller');

// ===== Multer Config ตัวเลือกว่าจะเก็บรูปไว้ที่ไหน โดยในโค้ดนี้คือ เก็บลงเครื่องแล้วสร้าง path /uploads/work_orders มารองรับ =====
const UPLOAD_DIR = path.join(__dirname, '../uploads/work_orders');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const workorderDir = path.join(UPLOAD_DIR, req.params.id);
    if (!fs.existsSync(workorderDir)) {
      fs.mkdirSync(workorderDir, { recursive: true });
    }
    cb(null, workorderDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const type = req.query.image_type || 'unknown';
    const timestamp = Date.now();
    cb(null, `${type}_${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ===== Routes =====

// GET  /api/activity-orders/:id/images
router.get('/', auth, controller.getImages);

// POST /api/activity-orders/:id/images
router.post('/', auth, upload.single('image'), controller.uploadImage);

// DELETE /api/activity-orders/:id/images/:imageId
router.delete('/:imageId', auth, controller.deleteImage);

module.exports = router;