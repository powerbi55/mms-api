const db = require('../config/db');

exports.getAllRepairs = async () => {
  const [rows] = await db.query(`
    SELECT
      requester_id,
      dep_alert,
      location,
      dep_requester,
      detail_report
    FROM data_imports
    ORDER BY timestamp DESC
  `);

  return rows;
};
