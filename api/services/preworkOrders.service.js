const db = require('../config/db');

exports.getWorkOrderById = async (id) => {
  const [rows] = await db.query(
    `SELECT
       workorder_id,
       requester_id,
       detail_report,
       dep_id,
       location_id,
       jobstatus_id,
       job_reference
     FROM work_orders
     WHERE workorder_id = ?`,
    [id]
  );
  return rows[0];
};

/* dropdown services */
exports.getPersonnel = async () =>
  db.query('SELECT pns_id, pns_name FROM personnel ORDER BY pns_name');

exports.getDepartments = async () =>
  db.query('SELECT dep_id, dep_name FROM departments ORDER BY dep_name');

exports.getLocations = async () =>
  db.query('SELECT location_id, location_name FROM locations ORDER BY location_name');

exports.getJobStatuses = async () =>
  db.query('SELECT jobstatus_id, status_name FROM master_statuses');

/* update + job_reference */
exports.updateWorkOrder = async (id, data) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [old] = await conn.query(
      'SELECT job_reference FROM work_orders WHERE workorder_id = ?',
      [id]
    );

    if (!old.length) throw new Error('Work order not found');

    let job_reference = old[0].job_reference;

    // 🔥 สร้าง job_reference เฉพาะตอนยังไม่มี
    if (!job_reference) {
      const buddhistYear = (new Date().getFullYear() + 543)
        .toString()
        .slice(-2);

      const [run] = await conn.query(
        `
        SELECT LPAD(
          IFNULL(
            MAX(CAST(SUBSTRING_INDEX(job_reference,'-',-1) AS UNSIGNED)),
            0
          ) + 1,
          6,
          '0'
        ) AS running
        FROM work_orders
        WHERE dep_id = ?
          AND job_reference IS NOT NULL
        `,
        [data.dep_id]
      );

      job_reference = `${data.dep_id}-${buddhistYear}-${run[0].running}`;
    }

    await conn.query(
      `
      UPDATE work_orders
      SET requester_user_id = ?,
          detail_report     = ?,
          dep_id            = ?,
          location_id       = ?,
          jobstatus_id      = ?,
          job_reference     = ?,
          update_datetime   = NOW()
      WHERE workorder_id   = ?
      `,
      [
        data.requester_user_id,
        data.detail_report,
        data.dep_id,
        data.location_id,
        data.jobstatus_id,
        job_reference,
        id
      ]
    );

    await conn.commit();
    return job_reference;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
