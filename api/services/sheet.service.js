const db = require('../config/db');

exports.importFromGoogleSheet = async (rows) => {
  let inserted = 0;

  for (const row of rows) {
    const [
      timestamp,
      requester_id,
      dep_alert,
      location,
      dep_requester,
      detail_report
    ] = row;

    // validate ข้อมูลที่จำเป็น
    if (!requester_id || !detail_report) continue;

    const sql = `
      INSERT INTO data_imports
      (timestamp, requester_id, dep_alert, location, dep_requester, detail_report)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      timestamp,
      requester_id,
      dep_alert,
      location,
      dep_requester,
      detail_report
    ]);

    inserted++;
  }

  return inserted;
};
