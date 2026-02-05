// preworkOrders คือหน้าหลังจากตาราง preworkOrders ที่เเสดงรายการเเจ้งที่ยังไม่มีการกดรับงาน
// หน้านี้มีหน้าที่สำหรับเเก้ไขข้อมูลก่อนเเปิดงาน เมื่อกดบันทึกจะมีการสร้างรหัสงาน (job_reference) เเละอัพเดทสถานะงาน
const db = require('../config/db');

//===================สำหรับเลือก work order มาทั้งหมด=============================
//===========================================================================
exports.getWorkOrderList = async () => {
  const [rows] = await db.query(`
    SELECT
      wo.workorder_id              AS id,
      wo.job_reference             AS workOrder,
      DATE(wo.creation_datetime)   AS reportedDate,
      wo.requester_user_id         AS reportBy,
      wo.detail_report             AS shortDescription,
      wo.dep_id                    AS department,
      wo.equipment_id              AS equipment,
      wo.jobstatus_id              AS errorSymptom,
      wo.post_date                 AS requiredStart,
      wo.post_date                 AS requiredFinish,
      wo.tp_id                     AS siteId,
      wo.jobstatus_id
    FROM work_orders wo
    WHERE wo.jobstatus_id = 99
    ORDER BY wo.creation_datetime DESC
  `);

  return rows;
};



//===================สำหรับเลือก work order ตาม id=============================
//===========================================================================
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
//===========================================================================
//===========================================================================

//==================ดึงข้อมูล dropdown=======================================
//===========================================================================
exports.getPersonnel = async () =>
  db.query('SELECT pns_id, pns_name FROM personnel ORDER BY pns_name');

exports.getDepartments = async () =>
  db.query('SELECT dep_id, dep_name FROM departments ORDER BY dep_name');

exports.getLocations = async () =>
  db.query('SELECT location_id, location_name FROM locations ORDER BY location_name');

exports.getJobStatuses = async () =>
  db.query('SELECT jobstatus_id, status_name FROM master_statuses');
//===========================================================================
//===========================================================================

//==================อัพเดท work order========================================
//===========================================================================

/**
 * ✅ แก้ตรงนี้:
 * - รับ updated_by แยกจาก data
 */
exports.updateWorkOrder = async (id, data, updated_by) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    /* ----------------------------------------
       1) ดึงข้อมูลเดิม
    ---------------------------------------- */
    const [oldRows] = await conn.query(
      `
      SELECT
        requester_id,
        detail_report,
        dep_id,
        location_id,
        jobstatus_id,
        job_reference
      FROM work_orders
      WHERE workorder_id = ?
      `,
      [id]
    );

    if (!oldRows.length) {
      throw new Error('Work order not found');
    }

    const old = oldRows[0];
    let job_reference = old.job_reference;

    /* ----------------------------------------
       2) สร้าง job_reference ถ้ายังไม่มี
    ---------------------------------------- */
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

    /* ----------------------------------------
       3) สร้าง changes object
    ---------------------------------------- */
    const changes = {};

    const compare = (field, oldVal, newVal) => {
      if (oldVal !== newVal) {
        changes[field] = {
          old: oldVal ?? null,
          new: newVal ?? null
        };
      }
    };

    compare('requester_id', old.requester_id, data.requester_id);
    compare('detail_report', old.detail_report, data.detail_report);
    compare('dep_id', old.dep_id, data.dep_id);
    compare('location_id', old.location_id, data.location_id);
    compare('jobstatus_id', old.jobstatus_id, data.jobstatus_id);
    compare('job_reference', old.job_reference, job_reference);

    /* ----------------------------------------
       4) UPDATE work_orders
    ---------------------------------------- */
    await conn.query(
      `
      UPDATE work_orders
      SET requester_id     = ?,
          detail_report    = ?,
          dep_id           = ?,
          location_id      = ?,
          jobstatus_id     = ?,
          job_reference    = ?,
          update_datetime  = NOW()
      WHERE workorder_id   = ?
      `,
      [
        data.requester_id,
        data.detail_report,
        data.dep_id,
        data.location_id,
        data.jobstatus_id,
        job_reference,
        id
      ]
    );

    /* ----------------------------------------
       5) INSERT log
    ---------------------------------------- */
    if (Object.keys(changes).length > 0) {
      await conn.query(
        `
        INSERT INTO work_order_logs
          (workorder_id, action, changes, changed_by)
        VALUES (?, 'update', ?, ?)
        `,
        [
          id,
          JSON.stringify(changes),
          updated_by   // ✅ ใช้ค่าที่รับมาตรง ๆ
        ]
      );
    }

    await conn.commit();
    return job_reference;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//===========================================================================
//===========================================================================
