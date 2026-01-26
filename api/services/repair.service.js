const db = require('../config/db');

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
  `);

  return rows;
};
