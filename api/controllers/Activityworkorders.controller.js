// activityWorkOrders.controller.js
const service = require('../services/Activityworkorders.service');

//=====================================================================
// ดึง Active Work Order List
//=====================================================================
exports.getActiveWorkOrderList = async (req, res) => {
  try {
    const filters = {
      workOrder: req.query.workOrder || '',
      equipment: req.query.equipment || '',
      siteId: req.query.siteId || '',
      department: req.query.department || '',
    };

    console.log('🔍 Active WO filters:', filters);

    const rows = await service.getActiveWorkOrderList(filters);

    res.json({
      ok: true,
      data: rows,
      filters,
    });
  } catch (err) {
    console.error('❌ Error in getActiveWorkOrderList:', err);
    res.status(500).json({ 
      ok: false,
      message: 'ไม่สามารถดึงข้อมูล Active Work Orders ได้',
      error: err.message 
    });
  }
};

//=====================================================================
// ดึงรายละเอียด Work Order 1 ตัว
//=====================================================================
exports.getActivityWorkOrder = async (req, res) => {
  try {
    const data = await service.getActivityWorkOrderById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: 'Work order not found',
      });
    }

    res.json({
      ok: true,
      data,
    });
  } catch (err) {
    console.error('❌ Error in getActivityWorkOrder:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// ดึง Activities ของ Work Order
//=====================================================================
exports.getActivities = async (req, res) => {
  try {
    const activities = await service.getActivitiesByWorkOrderId(req.params.id);

    res.json({
      ok: true,
      data: activities,
    });
  } catch (err) {
    console.error('❌ Error in getActivities:', err);
    res.status(500).json({
      ok: false,
      message: 'ไม่สามารถดึงข้อมูล Activities ได้',
      error: err.message,
    });
  }
};

//=====================================================================
// ดึง Master Data สำหรับ Dropdowns
//=====================================================================
exports.getActivityMasters = async (req, res) => {
  try {
    const masters = await service.getActivityMasters();

    res.json({
      ok: true,
      ...masters,
    });
  } catch (err) {
    console.error('❌ Error in getActivityMasters:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'ไม่สามารถดึงข้อมูล dropdowns ได้',
      error: err.message 
    });
  }
};

//=====================================================================
// Update Work Order (General Tab)
//=====================================================================
exports.updateActivityWorkOrder = async (req, res) => {
  try {
    const updated_by = req.user?.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info',
      });
    }

    const result = await service.updateActivityWorkOrder(
      req.params.id,
      req.body,
      updated_by
    );

    res.json({
      ok: true,
      message: 'อัพเดทงานสำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in updateActivityWorkOrder:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// Update Preparations (Prepare Tab)
//=====================================================================
exports.updatePreparations = async (req, res) => {
  try {
    const updated_by = req.user?.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info',
      });
    }

    const result = await service.updatePreparations(
      req.params.id,
      req.body,
      updated_by
    );

    res.json({
      ok: true,
      message: 'อัพเดท Preparations สำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in updatePreparations:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// Add Activity (Activity Tab)
//=====================================================================
exports.addActivity = async (req, res) => {
  try {
    const updated_by = req.user?.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info',
      });
    }

    const result = await service.addActivity(
      req.params.id,
      req.body,
      updated_by
    );

    res.json({
      ok: true,
      message: 'เพิ่ม Activity สำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in addActivity:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// Delete Activity
//=====================================================================
exports.deleteActivity = async (req, res) => {
  try {
    const result = await service.deleteActivity(req.params.activityId);

    res.json({
      ok: true,
      message: 'ลบ Activity สำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in deleteActivity:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// Update Job Status Only
//=====================================================================
exports.updateJobStatus = async (req, res) => {
  try {
    const updated_by = req.user?.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info',
      });
    }

    const { jobstatus_id } = req.body;

    if (!jobstatus_id) {
      return res.status(400).json({
        ok: false,
        message: 'กรุณาระบุ jobstatus_id',
      });
    }

    const result = await service.updateJobStatus(
      req.params.id,
      jobstatus_id,
      updated_by
    );

    res.json({
      ok: true,
      message: 'เปลี่ยนสถานะงานสำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in updateJobStatus:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// Update Report (Report Tab)
//=====================================================================
exports.updateReport = async (req, res) => {
  try {
    const updated_by = req.user?.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info',
      });
    }

    const result = await service.updateReport(
      req.params.id,
      req.body,
      updated_by
    );

    res.json({
      ok: true,
      message: 'อัพเดท Report สำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in updateReport:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};