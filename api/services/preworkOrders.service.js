// preworkOrders.service.js
// ✅ แก้ไข: ใช้ตาราง 'lookups' และลบ fault_code ออก
const db = require("../config/db");

//===================สำหรับเลือก work order มาทั้งหมด=============================
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
      COALESCE(d.dep_name, '-') AS departments,
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
exports.getWorkOrderById = async (id) => {
  const [rows] = await db.query(`
    SELECT
      -- Work Orders (หลัก)
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
      wo.fund_id,
      wo.creation_datetime,
      wo.import_timestamp,
      
      -- Work Order Plannings (วางแผน)
      pl.priority_id,
      pl.req_start_datetime AS required_start_datetime,
      pl.req_finish_datetime AS required_finish_datetime,
      
      -- Work Order Faults (ความเสียหาย)
      f.impact_id,
      f.symptom_id AS error_symptom_id,
      f.job_breakdown AS breakdown,
      
      -- JOIN display names
      COALESCE(p1.pns_name, p2.pns_name, '-') AS reportBy,
      COALESCE(d.dep_name, '-') AS department,
      COALESCE(l.location_name, '-') AS location_name,
      COALESCE(e.equipment_name, '-') AS equipment,
      COALESCE(c.customer_name, '-') AS customer_name,
      COALESCE(fn.fund_name, '-') AS fund_name,
      ms.jobstatus_type AS statusName
      
    FROM work_orders wo
    LEFT JOIN work_order_plannings pl ON wo.workorder_id = pl.workorder_id
    LEFT JOIN work_order_faults f ON wo.workorder_id = f.workorder_id
    LEFT JOIN personnel p1 ON wo.requester_user_id = p1.pns_id
    LEFT JOIN personnel p2 ON wo.requester_id = p2.pns_id
    LEFT JOIN departments d ON wo.dep_id = d.dep_id
    LEFT JOIN locations l ON wo.location_id = l.location_id
    LEFT JOIN equipment_storages e ON wo.equipment_id = e.equipment_id
    LEFT JOIN customers c ON wo.customer_id = c.customer_id
    LEFT JOIN fund_center fn ON wo.fund_id = fn.fund_id
    LEFT JOIN master_statuses ms ON wo.jobstatus_id = ms.jobstatus_id
    WHERE wo.workorder_id = ?
  `, [id]);
  
  return rows[0] || null;
};

//==================ดึงข้อมูล dropdown=======================================
// ✅ เพิ่ม error handling และ logging
// ✅ แก้ไข: ใช้ตาราง 'lookups' และลบ getFaultCodes ออก

exports.getPersonnel = async () => {
  try {
    const result = await db.query(
      "SELECT pns_id AS value, pns_name AS label FROM personnel ORDER BY pns_name"
    );
    console.log(`✅ Personnel: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getPersonnel:', error.message);
    return [[]];
  }
};

exports.getDepartments = async () => {
  try {
    const result = await db.query(
      "SELECT dep_id AS value, dep_name AS label FROM departments ORDER BY dep_name"
    );
    console.log(`✅ Departments: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getDepartments:', error.message);
    return [[]];
  }
};

exports.getLocations = async () => {
  try {
    const result = await db.query(
      "SELECT location_id AS value, location_name AS label FROM locations ORDER BY location_name"
    );
    console.log(`✅ Locations: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getLocations:', error.message);
    return [[]];
  }
};

exports.getJobStatuses = async () => {
  try {
    const result = await db.query(
      "SELECT jobstatus_id AS value, jobstatus_type AS label FROM master_statuses ORDER BY jobstatus_id"
    );
    console.log(`✅ Job Statuses: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getJobStatuses:', error.message);
    return [[]];
  }
};

exports.getEquipments = async () => {
  try {
    const result = await db.query(`
      SELECT equipment_id AS value, equipment_name AS label
      FROM equipment_storages
      ORDER BY equipment_name
    `);
    console.log(`✅ Equipments: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getEquipments:', error.message);
    return [[]];
  }
};

exports.getCustomers = async () => {
  try {
    const result = await db.query(`
      SELECT customer_id AS value, customer_name AS label
      FROM customers
      ORDER BY customer_name
    `);
    console.log(`✅ Customers: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getCustomers:', error.message);
    return [[]];
  }
};

exports.getImpacts = async () => {
  try {
    const result = await db.query(`
      SELECT lookup_id AS value, lookup_name AS label
      FROM lookups
      WHERE lookup_type = 'impact'
      ORDER BY lookup_name
    `);
    console.log(`✅ Impacts: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getImpacts:', error.message);
    return [[]];
  }
};

exports.getErrorSymptoms = async () => {
  try {
    const result = await db.query(`
      SELECT lookup_id AS value, lookup_name AS label
      FROM lookups
      WHERE lookup_type = 'symptom'
      ORDER BY lookup_name
    `);
    console.log(`✅ Error Symptoms: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getErrorSymptoms:', error.message);
    return [[]];
  }
};

// ✅ แก้ไข: เช็ค lookup_type ทั้ง 'priority' และ 'priorities'
exports.getPriorities = async () => {
  try {
    const result = await db.query(`
      SELECT lookup_id AS value, lookup_name AS label
      FROM lookups
      WHERE lookup_type IN ('priority', 'priorities')
      ORDER BY lookup_name
    `);
    console.log(`✅ Priorities: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getPriorities:', error.message);
    return [[]];
  }
};

// ❌ ลบฟังก์ชัน getFaultCodes ออกแล้ว

exports.getFunds = async () => {
  try {
    const result = await db.query(`
      SELECT fund_id AS value, fund_name AS label
      FROM fund_center
      ORDER BY fund_name
    `);
    console.log(`✅ Funds: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getFunds:', error.message);
    return [[]];
  }
};

exports.getFundCenters = async () => {
  try {
    const result = await db.query(`
      SELECT fund_id AS value, fund_name AS label
      FROM fund_center
      ORDER BY fund_name
    `);
    console.log(`✅ Fund Centers: ${result[0]?.length || 0} records`);
    return result;
  } catch (error) {
    console.error('❌ Error in getFundCenters:', error.message);
    return [[]];
  }
};

//==================เปิดงาน (Open Job)========================================
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
        wo.requester_user_id,
        wo.requester_id,
        wo.detail_report,
        wo.dep_id,
        wo.location_id,
        wo.jobstatus_id,
        wo.job_reference,
        wo.fund_id,
        pl.priority_id,
        pl.req_start_datetime,
        pl.req_finish_datetime,
        f.impact_id,
        f.symptom_id AS error_symptom_id,
        f.job_breakdown AS breakdown
      FROM work_orders wo
      LEFT JOIN work_order_plannings pl ON wo.workorder_id = pl.workorder_id
      LEFT JOIN work_order_faults f ON wo.workorder_id = f.workorder_id
      WHERE wo.workorder_id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (!oldRows.length) {
      throw new Error("ไม่พบงานนี้");
    }

    const old = oldRows[0];
    const isFirstOpen = !old.job_reference;

    let job_reference = old.job_reference;
    let newStatus = data.jobstatus_id;

    /* ----------------------------------------
       2) Validation
    ---------------------------------------- */
    if (data.required_start_datetime && data.required_finish_datetime) {
      const startDate = new Date(data.required_start_datetime);
      const finishDate = new Date(data.required_finish_datetime);
      
      if (finishDate <= startDate) {
        throw new Error("Required Finish ต้องมากกว่า Required Start");
      }
    }

    const effectiveDepId = data.dep_id || old.dep_id;
    const effectiveRequesterId = data.requester_id || old.requester_id;
    const effectiveDetailReport = data.detail_report || old.detail_report;

    if (!effectiveDepId) throw new Error("กรุณาเลือกหน่วยงานก่อนเปิดงาน");
    if (!effectiveRequesterId) throw new Error("กรุณายืนยันผู้แจ้งงานก่อนเปิดงาน");
    if (!effectiveDetailReport || effectiveDetailReport.trim() === '') 
      throw new Error("กรุณากรอกรายละเอียดปัญหาก่อนเปิดงาน");
    if (!newStatus || newStatus === 99) 
      throw new Error("กรุณาเลือกสถานะงานที่เหมาะสม (ไม่ใช่สถานะรอยืนยัน)");

    /* ----------------------------------------
       3) สร้าง job_reference (ถ้ายังไม่มี)
    ---------------------------------------- */
    if (isFirstOpen) {
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
        [effectiveDepId]
      );

      job_reference = `${effectiveDepId}-${buddhistYear}-${run[0].running}`;
    }

    /* ----------------------------------------
       4) UPDATE work_orders (ตารางหลัก)
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
          fund_id          = ?,
          update_datetime  = NOW()
      WHERE workorder_id   = ?
      `,
      [
        data.requester_id ?? old.requester_id,
        data.detail_report ?? old.detail_report,
        data.dep_id ?? old.dep_id,
        data.location_id ?? old.location_id,
        newStatus,
        job_reference,
        data.fund_id ?? old.fund_id,
        id,
      ]
    );

    /* ----------------------------------------
       5) UPSERT work_order_plannings
    ---------------------------------------- */
    if (data.priority_id || data.required_start_datetime || data.required_finish_datetime) {
      const [planningExists] = await conn.query(
        'SELECT planning_id FROM work_order_plannings WHERE workorder_id = ?',
        [id]
      );
      
      if (planningExists.length > 0) {
        await conn.query(`
          UPDATE work_order_plannings
          SET priority_id = ?,
              req_start_datetime = ?,
              req_finish_datetime = ?
          WHERE workorder_id = ?
        `, [
          data.priority_id ?? old.priority_id,
          data.required_start_datetime ?? old.req_start_datetime,
          data.required_finish_datetime ?? old.req_finish_datetime,
          id
        ]);
      } else {
        await conn.query(`
          INSERT INTO work_order_plannings 
            (workorder_id, priority_id, req_start_datetime, req_finish_datetime)
          VALUES (?, ?, ?, ?)
        `, [
          id,
          data.priority_id,
          data.required_start_datetime,
          data.required_finish_datetime
        ]);
      }
    }

    /* ----------------------------------------
       6) UPSERT work_order_faults
    ---------------------------------------- */
    if (data.impact_id || data.error_symptom_id || data.breakdown !== undefined) {
      const [faultExists] = await conn.query(
        'SELECT faults_id FROM work_order_faults WHERE workorder_id = ?',
        [id]
      );
      
      const breakdownValue = data.breakdown === 'YES' ? 1 : 0;
      
      if (faultExists.length > 0) {
        await conn.query(`
          UPDATE work_order_faults
          SET impact_id = ?,
              symptom_id = ?,
              job_breakdown = ?,
              faultdescription = ?
          WHERE workorder_id = ?
        `, [
          data.impact_id ?? old.impact_id,
          data.error_symptom_id ?? old.error_symptom_id,
          breakdownValue,
          data.detail_report ?? old.detail_report,
          id
        ]);
      } else {
        await conn.query(`
          INSERT INTO work_order_faults 
            (workorder_id, impact_id, symptom_id, job_breakdown, faultdescription)
          VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          data.impact_id,
          data.error_symptom_id,
          breakdownValue,
          data.detail_report || ''
        ]);
      }
    }

    /* ----------------------------------------
       7) Log การเปลี่ยนแปลง
    ---------------------------------------- */
    await conn.query(
      `
      INSERT INTO work_order_logs
        (workorder_id, action, changes, changed_by, created_at)
      VALUES (?, ?, ?, ?, NOW())
      `,
      [id, 'open_job', JSON.stringify(data), updated_by]
    );

    await conn.commit();
    return {
      job_reference,
      jobstatus_id: newStatus,
      isFirstOpen,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};