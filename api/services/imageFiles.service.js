// imageFiles.service.js
const db = require('../config/db');
const fs = require('fs');

//=================== ดึงรูปภาพของ Work Order ===================
exports.getImagesByWorkOrderId = async (workorder_id) => {
  const [rows] = await db.query(
    `SELECT image_id, workorder_id, image_type, file_name, file_path, created_at
     FROM image_files
     WHERE workorder_id = ?
     ORDER BY image_type, created_at`,
    [workorder_id]
  );
  return rows;
};

//=================== Upload รูปภาพ ===================
exports.uploadImage = async (workorder_id, image_type, file, created_by) => {
  const { filename, path: absolutePath } = file;

  // ✅ แปลงเป็น relative path สำหรับใช้เป็น URL
  // เช่น "uploads/work_orders/123/before_xxx.jpg"
  const idx = absolutePath.replace(/\\/g, '/').indexOf('uploads/');
  const relativePath = idx !== -1
    ? absolutePath.replace(/\\/g, '/').slice(idx)
    : `uploads/work_orders/${workorder_id}/${filename}`;

  const [result] = await db.query(
    `INSERT INTO image_files (workorder_id, image_type, file_name, file_path, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [workorder_id, image_type, filename, relativePath, created_by || null]
  );

  return { image_id: result.insertId, file_name: filename, file_path: relativePath };
};

//=================== ลบรูปภาพ ===================
exports.deleteImage = async (image_id, workorder_id) => {
  const [rows] = await db.query(
    `SELECT file_path FROM image_files WHERE image_id = ? AND workorder_id = ?`,
    [image_id, workorder_id]
  );

  if (!rows.length) {
    throw new Error('ไม่พบรูปภาพนี้');
  }

  const relativePath = rows[0].file_path;

  await db.query(
    `DELETE FROM image_files WHERE image_id = ? AND workorder_id = ?`,
    [image_id, workorder_id]
  );

  // ลบไฟล์จาก disk (ถ้ามี)
  // ✅ แปลง relative path กลับเป็น absolute path สำหรับลบไฟล์จริง
  if (relativePath) {
    const absoluteFilePath = require('path').join(__dirname, '..', relativePath);
    if (fs.existsSync(absoluteFilePath)) {
      fs.unlinkSync(absoluteFilePath);
    }
  }

  return { success: true };
};