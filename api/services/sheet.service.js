const db = require('../config/db');
//============================= นำเข้าข้อมูลจาก Google Sheet ==========================
//==================================================================================
exports.importFromGoogleSheet = async (rows) => {
  let inserted = 0;                                                              //let inserted = 0;

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
    if (!requester_id || !detail_report) continue;                                //ถ้าไม่มี requester_id หรือ detail_report → ข้าม record นี้

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
//==================================================================================
//==================================================================================