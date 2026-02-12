// preworkOrders.service.js
// preworkOrders คือหน้าหลังจากตาราง preworkOrders ที่เเสดงรายการเเจ้งที่ยังไม่มีการกดรับงาน
// หน้านี้มีหน้าที่สำหรับเเก้ไขข้อมูลก่อนเเปิดงาน เมื่อกดบันทึกจะมีการสร้างรหัสงาน (job_reference) เเละอัพเดทสถานะงาน
const db = require("../config/db");

//===================สำหรับเลือก work order มาทั้งหมด=============================
//===========================================================================
exports.getWorkOrderList = async () => {
  const [rows] = await db.query(`
    SELECT
      wo.workorder_id AS id,
      wo.workorder_id AS workOrder,
      DATE_FORMAT(wo.import_timestamp, '%Y-%m-%d %H:%i') AS reportedDate,
      COALESCE(
        p1.pns_name,
        p2.pns_name,
        wo.requester_user_id,
        wo.requester_id,
        '-'
      ) AS reportBy,
      COALESCE(wo.detail_report, '-') AS shortDescription,
      COALESCE(d.dep_name, '-') AS department,
      COALESCE(e.equipment_name, '-') AS equipment,
      '-' AS errorSymptom,
      COALESCE(c.customer_id, '-') AS customerCode,
      COALESCE(l.location_id, '-') AS siteId,
      wo.requester_user_id AS rawRequesterId,
      wo.requester_id AS confirmedRequesterId,
      wo.job_reference,
      wo.jobstatus_id,
      ms.jobstatus_type AS currentStatusName   
    FROM work_orders wo
    LEFT JOIN personnel p1 ON wo.requester_user_id = p1.pns_id
    LEFT JOIN personnel p2 ON wo.requester_id = p2.pns_id
    LEFT JOIN departments d ON wo.dep_id = d.dep_id
    LEFT JOIN locations l ON wo.location_id = l.location_id
    LEFT JOIN equipment_storages e ON wo.equipment_id = e.equipment_id
    LEFT JOIN customers c ON wo.customer_id = c.customer_id
    LEFT JOIN master_statuses ms ON wo.jobstatus_id = ms.jobstatus_id
    WHERE wo.jobstatus_id = 99
      AND wo.job_reference IS NULL
    ORDER BY wo.import_timestamp DESC
  `);

  return rows;
};

//===================สำหรับเลือก work order ตาม id=============================
//===========================================================================
exports.getWorkOrderById = async (id) => {
  const [rows] = await db.query(
    `SELECT
       wo.workorder_id,
       wo.job_reference,
       wo.requester_user_id,
       wo.requester_id,
       wo.detail_report,
       wo.dep_id,
       wo.location_id,
       wo.jobstatus_id,
       wo.equipment_id,
       wo.customer_id,
       wo.import_timestamp,
       wo.creation_datetime,
       
       -- ข้อมูลเพิ่มเติมจาก JOIN
       COALESCE(p1.pns_name, p2.pns_name, wo.requester_user_id, '-') AS reportBy,
       COALESCE(d.dep_name, '-') AS department,
       COALESCE(l.location_name, '-') AS location_name,
       COALESCE(e.equipment_name, '-') AS equipment,
       COALESCE(c.customer_name, '-') AS customer_name,
       ms.jobstatus_type AS statusName
       
     FROM work_orders wo
     LEFT JOIN personnel p1 ON wo.requester_user_id = p1.pns_id
     LEFT JOIN personnel p2 ON wo.requester_id = p2.pns_id
     LEFT JOIN departments d ON wo.dep_id = d.dep_id
     LEFT JOIN locations l ON wo.location_id = l.location_id
     LEFT JOIN equipment_storages e ON wo.equipment_id = e.equipment_id
     LEFT JOIN customers c ON wo.customer_id = c.customer_id
     LEFT JOIN master_statuses ms ON wo.jobstatus_id = ms.jobstatus_id
     WHERE wo.workorder_id = ?`,
    [id]
  );
  return rows[0] || null;
};

//===========================================================================
//===========================================================================

//==================ดึงข้อมูล dropdown=======================================
//===========================================================================
exports.getPersonnel = async () =>
  db.query("SELECT pns_id AS value, pns_name AS label FROM personnel ORDER BY pns_name");

exports.getDepartments = async () =>
  db.query("SELECT dep_id AS value, dep_name AS label FROM departments ORDER BY dep_name");

exports.getLocations = async () =>
  db.query(
    "SELECT location_id AS value, location_name AS label FROM locations ORDER BY location_name",
  );

exports.getJobStatuses = async () =>
  db.query("SELECT jobstatus_id AS value, jobstatus_type AS label FROM master_statuses ORDER BY jobstatus_id");

exports.getEquipments = () =>
  db.query(`
    SELECT equipment_id AS value, equipment_name AS label
    FROM equipment_storages
    ORDER BY equipment_name
  `);

exports.getCustomers = () =>
  db.query(`
    SELECT customer_id AS value, customer_name AS label
    FROM customers
    ORDER BY customer_name
  `);

exports.getImpacts = () =>
  db.query(`
    SELECT lookup_id AS value, lookup_name AS label
    FROM lookups
    WHERE lookup_type = 'impact'
    ORDER BY lookup_name
  `);

exports.getErrorSymptoms = () =>
  db.query(`
    SELECT lookup_id AS value, lookup_name AS label
    FROM lookups
    WHERE lookup_type = 'symptom'
    ORDER BY lookup_name
  `);

exports.getPriorities = () =>
  db.query(`
    SELECT lookup_id AS value, lookup_name AS label
    FROM lookups
    WHERE lookup_type = 'priority'
    ORDER BY lookup_name
  `);

exports.getFaultCodes = () =>
  db.query(`
    SELECT lookup_id AS value, lookup_name AS label
    FROM lookups
    WHERE lookup_type = 'fault_code'
    ORDER BY lookup_name
  `);

//===========================================================================
//===========================================================================

//==================อัพเดท work order========================================
//===========================================================================

/**
 * รองรับสองโหมด:
 * - บันทึกชั่วคราว (draft): confirmOpen = false หรือไม่ส่ง field นี้
 * - เปิดงานจริง: confirmOpen = true + ต้องส่ง jobstatus_id มาด้วย
 * 
 * Validation เพิ่มเติม:
 * - ตอนเปิดงาน: ตรวจ dep_id, requester_id, detail_report ไม่ว่าง, jobstatus_id != 99
 * 
 * Log action: 'open_job' หรือ 'update_draft'
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
        requester_user_id,
        requester_id,
        detail_report,
        dep_id,
        location_id,
        jobstatus_id,
        job_reference
      FROM work_orders
      WHERE workorder_id = ?
      FOR UPDATE
      `,
      [id],
    );

    if (!oldRows.length) {
      throw new Error("ไม่พบงานนี้");
    }

    const old = oldRows[0];
    const isFirstOpen = !old.job_reference;
    const confirmOpen = data.confirmOpen === true;

    let job_reference = old.job_reference;
    let newStatus = old.jobstatus_id;

    /* ----------------------------------------
       2) กรณีเปิดงานจริง (confirmOpen = true)
    ---------------------------------------- */
    if (confirmOpen) {
      if (!isFirstOpen) {
        // งานเปิดแล้ว → อนุญาตเปลี่ยน status ได้ แต่ไม่สร้าง ref ใหม่
        newStatus = data.jobstatus_id ?? old.jobstatus_id;
      } else {
        // เปิดงานครั้งแรก
        const effectiveDepId = data.dep_id || old.dep_id;
        const effectiveRequesterId = data.requester_id || old.requester_id;
        const effectiveDetailReport = data.detail_report || old.detail_report;
        const selectedStatus = data.jobstatus_id;

        // Validation เพิ่มเติม
        if (!effectiveDepId) throw new Error("กรุณาเลือกหน่วยงานก่อนเปิดงาน");
        if (!effectiveRequesterId) throw new Error("กรุณายืนยันผู้แจ้งงานก่อนเปิดงาน");
        if (!effectiveDetailReport || effectiveDetailReport.trim() === '') throw new Error("กรุณากรอกรายละเอียดปัญหาก่อนเปิดงาน");
        if (!selectedStatus || selectedStatus === 99) throw new Error("กรุณาเลือกสถานะงานที่เหมาะสม (ไม่ใช่สถานะรอยืนยัน)");

        // สร้าง job_reference
        const buddhistYear = (new Date().getFullYear() + 543).toString().slice(-2);

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
          FOR UPDATE
          `,
          [effectiveDepId],
        );

        job_reference = `${effectiveDepId}-${buddhistYear}-${run[0].running}`;
        newStatus = selectedStatus;
      }
    } 
    /* ----------------------------------------
       3) กรณีบันทึกชั่วคราว (draft)
    ---------------------------------------- */
    else {
      job_reference = old.job_reference;
      newStatus = old.jobstatus_id; // คง 99
      // Validation เบา ๆ สำหรับ draft (เช่น ไม่ให้ว่างหมด แต่ไม่บังคับมาก)
    }

    /* ----------------------------------------
       4) เตรียมข้อมูลอัพเดท
    ---------------------------------------- */
    const updateData = {
      requester_id: data.requester_id ?? old.requester_id,
      detail_report: data.detail_report ?? old.detail_report,
      dep_id: data.dep_id ?? old.dep_id,
      location_id: data.location_id ?? old.location_id,
      jobstatus_id: newStatus,
      job_reference: job_reference,
    };

    /* ----------------------------------------
       5) UPDATE work_orders
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
        updateData.requester_id,
        updateData.detail_report,
        updateData.dep_id,
        updateData.location_id,
        updateData.jobstatus_id,
        updateData.job_reference,
        id,
      ],
    );

    /* ----------------------------------------
       6) สร้าง changes object และ INSERT log
    ---------------------------------------- */
    const changes = {};

    const compare = (field, oldVal, newVal) => {
      if (oldVal !== newVal) {
        changes[field] = {
          old: oldVal ?? null,
          new: newVal ?? null,
        };
      }
    };

    compare("requester_id", old.requester_id, updateData.requester_id);
    compare("detail_report", old.detail_report, updateData.detail_report);
    compare("dep_id", old.dep_id, updateData.dep_id);
    compare("location_id", old.location_id, updateData.location_id);
    compare("jobstatus_id", old.jobstatus_id, updateData.jobstatus_id);
    compare("job_reference", old.job_reference, updateData.job_reference);

    if (Object.keys(changes).length > 0) {
      await conn.query(
        `
        INSERT INTO work_order_logs
          (workorder_id, action, changes, changed_by, created_at)
        VALUES (?, ?, ?, ?, NOW())
        `,
        [id, confirmOpen ? 'open_job' : 'update_draft', JSON.stringify(changes), updated_by],
      );
    }

    await conn.commit();
    return {
      job_reference,
      jobstatus_id: newStatus,
      isFirstOpen: isFirstOpen && confirmOpen,
      confirmOpen,
      requester_id: updateData.requester_id
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};