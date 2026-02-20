// imageFiles.controller.js
const service = require('../services/imageFiles.service');

//=====================================================================
// ดึงรูปภาพของ Work Order
//=====================================================================
exports.getImages = async (req, res) => {
  try {
    const images = await service.getImagesByWorkOrderId(req.params.id);
    res.json({ ok: true, data: images });
  } catch (err) {
    console.error('❌ Error in getImages:', err);
    res.status(500).json({ ok: false, message: 'ไม่สามารถดึงข้อมูลรูปภาพได้', error: err.message });
  }
};

//=====================================================================
// Upload รูปภาพ
//=====================================================================
exports.uploadImage = async (req, res) => {
  try {
    const { image_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'ไม่พบไฟล์รูปภาพ' });
    }

    if (!['before', 'after'].includes(image_type)) {
      return res.status(400).json({ ok: false, message: 'image_type ต้องเป็น before หรือ after' });
    }

    const created_by = req.user?.pns_id || null;
    const result = await service.uploadImage(req.params.id, image_type, req.file, created_by);

    res.json({ ok: true, message: 'อัปโหลดรูปภาพสำเร็จ', data: result });
  } catch (err) {
    console.error('❌ Error in uploadImage:', err);
    res.status(400).json({ ok: false, message: err.message });
  }
};

//=====================================================================
// ลบรูปภาพ
//=====================================================================
exports.deleteImage = async (req, res) => {
  try {
    const result = await service.deleteImage(req.params.imageId, req.params.id);
    res.json({ ok: true, message: 'ลบรูปภาพสำเร็จ', data: result });
  } catch (err) {
    console.error('❌ Error in deleteImage:', err);
    res.status(400).json({ ok: false, message: err.message });
  }
};