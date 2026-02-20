// Historicalworkorders.controller.js
// Read-only controller — ไม่มี PUT / POST / DELETE
const service = require('../services/Historicalworkorders.service');

//=====================================================================
// ดึง Historical Work Order List (jobstatus_id = 1 = Completed)
//=====================================================================
exports.getHistoricalWorkOrderList = async (req, res) => {
  try {
    const filters = {
      workOrder:  req.query.workOrder  || '',
      equipment:  req.query.equipment  || '',
      siteId:     req.query.siteId     || '',
      department: req.query.department || '',
    };

    console.log('📋 Historical WO filters:', filters);

    const rows = await service.getHistoricalWorkOrderList(filters);

    res.json({ ok: true, data: rows, filters });
  } catch (err) {
    console.error('❌ Error in getHistoricalWorkOrderList:', err);
    res.status(500).json({
      ok: false,
      message: 'ไม่สามารถดึงข้อมูล Historical Work Orders ได้',
      error: err.message,
    });
  }
};

//=====================================================================
// ดึงรายละเอียด Historical Work Order 1 ตัว
//=====================================================================
exports.getHistoricalWorkOrder = async (req, res) => {
  try {
    const data = await service.getHistoricalWorkOrderById(req.params.id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: 'Work Order not found หรือยังไม่ได้ Completed',
      });
    }

    res.json({ ok: true, data });
  } catch (err) {
    console.error('❌ Error in getHistoricalWorkOrder:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
};

//=====================================================================
// ดึง Activities ของ Historical Work Order (read-only)
//=====================================================================
exports.getHistoricalActivities = async (req, res) => {
  try {
    const activities = await service.getHistoricalActivitiesByWorkOrderId(req.params.id);
    res.json({ ok: true, data: activities });
  } catch (err) {
    console.error('❌ Error in getHistoricalActivities:', err);
    res.status(500).json({
      ok: false,
      message: 'ไม่สามารถดึงข้อมูล Activities ได้',
      error: err.message,
    });
  }
};

//=====================================================================
// ดึง Master Data สำหรับ Dropdowns (ใช้แสดง label ใน readonly fields)
//=====================================================================
exports.getHistoricalMasters = async (req, res) => {
  try {
    const masters = await service.getHistoricalMasters();
    res.json({ ok: true, ...masters });
  } catch (err) {
    console.error('❌ Error in getHistoricalMasters:', err);
    res.status(500).json({
      ok: false,
      message: 'ไม่สามารถดึงข้อมูล dropdowns ได้',
      error: err.message,
    });
  }
};