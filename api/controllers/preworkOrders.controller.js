// preworkOrders.controller.js
// ✅ ลบ faultCodes ออกแล้ว
const service = require('../services/preworkOrders.service');

//=====================================================================
// ดึง work order มาแสดงทั้งหมด
//=====================================================================
exports.getWorkOrderList = async (req, res) => {
  try {
    const rows = await service.getWorkOrderList();

    res.json({
      ok: true,
      data: rows,
    });
  } catch (err) {
    console.error('❌ Error in getWorkOrderList:', err);
    res.status(500).json({ 
      ok: false,
      message: 'ไม่สามารถดึงข้อมูล Work Orders ได้',
      error: err.message 
    });
  }
};

//=====================================================================
// ดึง work order 1 ตัวมาแสดง
//=====================================================================
exports.getWorkOrder = async (req, res) => {
  try {
    const data = await service.getWorkOrderById(req.params.id);

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
    console.error('❌ Error in getWorkOrder:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};

//=====================================================================
// Dropdowns textbox
// ✅ ลบ faultCodes ออกแล้ว
//=====================================================================
exports.getMasters = async (req, res) => {
  try {
    const [
      personnelRows,
      departmentRows,
      locationRows,
      jobStatusRows,
      equipmentRows,
      customerRows,
      impactRows,
      symptomRows,
      priorityRows,
      fundRows,
      fundCenterRows,
    ] = await Promise.all([
      service.getPersonnel(),
      service.getDepartments(),
      service.getLocations(),
      service.getJobStatuses(),
      service.getEquipments(),
      service.getCustomers(),
      service.getImpacts(),
      service.getErrorSymptoms(),
      service.getPriorities(),
      service.getFunds(),
      service.getFundCenters(),
    ]);

    // ✅ ลบ faultCodes ออกจาก response
    res.json({
      ok: true,
      personnel: personnelRows[0] || [],
      departments: departmentRows[0] || [],
      locations: locationRows[0] || [],
      jobStatuses: jobStatusRows[0] || [],
      equipments: equipmentRows[0] || [],
      customers: customerRows[0] || [],
      impacts: impactRows[0] || [],
      symptoms: symptomRows[0] || [],
      priorities: priorityRows[0] || [],
      funds: fundRows[0] || [],
      fundCenters: fundCenterRows[0] || [],
    });
  } catch (err) {
    console.error('❌ Error in getMasters:', err);
    res.status(500).json({ 
      ok: false, 
      message: 'ไม่สามารถดึงข้อมูล dropdowns ได้',
      error: err.message 
    });
  }
};

//=====================================================================
// Update Work Order
//=====================================================================
exports.updateWorkOrder = async (req, res) => {
  try {
    console.log('REQ.USER >>>', req.user);

    const updated_by = req.user?.pns_id;

    if (!updated_by) {
      return res.status(401).json({
        ok: false,
        message: 'Unauthorized: missing user info',
      });
    }

    const result = await service.updateWorkOrder(
      req.params.id,
      req.body,
      updated_by
    );

    res.json({
      ok: true,
      message: result.isFirstOpen ? 'เปิดงานสำเร็จ' : 'อัพเดทงานสำเร็จ',
      data: result,
    });
  } catch (err) {
    console.error('❌ Error in updateWorkOrder:', err);
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
};