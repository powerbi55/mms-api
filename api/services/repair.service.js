//ดึงรายการแจ้งซ่อมทั้งหมดที่มีสถานะ jobstatus_id = 99
const db = require('../config/db');

//===================ดึงรายการแจ้งซ่อมทั้งหมด=============================
//====================================================================
exports.getAllRepairs = async () => {
  const [rows] = await db.query(`
  SELECT
    workorder_id,
    import_timestamp,
    dep_id,
    requester_user_id,
    detail_report
  FROM work_orders
  WHERE jobstatus_id = 99
  ORDER BY import_timestamp DESC
  `);                             //เรียงลำดับจากเวลาที่แจ้งซ่อมล่าสุดที่มี status_id=-99(รอยับเปิดงาน)

  return rows;
};
//=====================================================================
//=====================================================================