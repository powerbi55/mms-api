// activityWorkOrders.service.js
const db = require("../config/db");

//=================== ดึง Work Order สำหรับ Active (ที่เปิดงานแล้ว) ===================
exports.getActiveWorkOrderList = async (filters = {}) => {
  let query = `
    SELECT
      wo.workorder_id,
      wo.job_reference,
      DATE_FORMAT(wo.import_timestamp, '%Y-%m-%d %H:%i') AS woGenDate,
      COALESCE(p1.pns_name, p2.pns_name, wo.requester_user_id, wo.requester_id, '-') AS reportBy,
      wo.detail_report AS description,
      COALESCE(d.dep_name, '-') AS department,
      COALESCE(e.equipment_name, '-') AS equipment,
      COALESCE(c.customer_id, '-') AS customerCode,
      COALESCE(l.location_id, '-') AS siteId,
      COALESCE(ms.jobstatus_type, '-') AS status,
      COALESCE(lw.lookup_name, '-') AS workType,
      COALESCE(lp.lookup_name, '-') AS priority,
      COALESCE(pm.pns_name, '-') AS workMaster,
      DATE_FORMAT(pl.plan_start_datetime, '%Y-%m-%d %H:%i') AS planStartDate,
      DATE_FORMAT(pl.plan_finish_datetime, '%Y-%m-%d %H:%i') AS planFinishDate,
      COALESCE(ls.lookup_name, '-') AS symptom,
      f.faultdescription AS faultDesc,
      wo.jobstatus_id
    FROM work_orders wo
    LEFT JOIN personnel p1 ON wo.requester_user_id = p1.pns_id
    LEFT JOIN personnel p2 ON wo.requester_id = p2.pns_id
    LEFT JOIN departments d ON wo.dep_id = d.dep_id
    LEFT JOIN locations l ON wo.location_id = l.location_id
    LEFT JOIN equipment_storages e ON wo.equipment_id = e.equipment_id
    LEFT JOIN customers c ON wo.customer_id = c.customer_id
    LEFT JOIN master_statuses ms ON wo.jobstatus_id = ms.jobstatus_id
    LEFT JOIN work_order_plannings pl ON wo.workorder_id = pl.workorder_id
    LEFT JOIN work_order_faults f ON wo.workorder_id = f.workorder_id
    LEFT JOIN lookups lw ON pl.worktype_type = lw.lookup_type AND pl.worktype_id = lw.lookup_id
    LEFT JOIN lookups lp ON pl.priority_type = lp.lookup_type AND pl.priority_id = lp.lookup_id
    LEFT JOIN lookups ls ON f.symptom_type = ls.lookup_type AND f.symptom_id = ls.lookup_id
    LEFT JOIN personnel pm ON pl.master_user_id = pm.pns_id
    WHERE wo.job_reference IS NOT NULL
      AND wo.jobstatus_id NOT IN (1,9,10, 99)
  `;

  const params = [];

  // 🔍 Filter by Work Order
  if (filters.workOrder) {
    query += ` AND wo.workorder_id LIKE ?`;
    params.push(`%${filters.workOrder}%`);
  }

  // 🔍 Filter by Equipment
  if (filters.equipment) {
    query += ` AND e.equipment_id = ?`;
    params.push(filters.equipment);
  }

  // 🔍 Filter by Site ID
  if (filters.siteId) {
    query += ` AND l.location_id LIKE ?`;
    params.push(`%${filters.siteId}%`);
  }

  // ✅ Filter by Department (เพิ่มใหม่)
  if (filters.department) {
    query += ` AND wo.dep_id = ?`;
    params.push(filters.department);
  }

  query += ` ORDER BY wo.update_datetime DESC`;

  const [rows] = await db.query(query, params);
  return rows;
};

//=================== ดึงรายละเอียด Work Order แบบเต็ม ===================
exports.getActivityWorkOrderById = async (id) => {
  const [rows] = await db.query(
    `
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
      DATE_FORMAT(wo.creation_datetime, '%Y-%m-%d %H:%i:%s') AS creation_datetime,
      wo.import_timestamp,
      wo.tp_id,
      wo.serial_no,
      wo.post_date,
      wo.main_leader_user_id,
      wo.child_worker_user_id,
      wo.group_id,
      
      -- Work Order Plannings
      pl.planning_id,
      pl.priority_id,
      DATE_FORMAT(pl.req_start_datetime,   '%Y-%m-%d %H:%i:%s') AS req_start_datetime,
      DATE_FORMAT(pl.req_finish_datetime,  '%Y-%m-%d %H:%i:%s') AS req_finish_datetime,
      DATE_FORMAT(pl.plan_start_datetime,  '%Y-%m-%d %H:%i:%s') AS plan_start_datetime,
      DATE_FORMAT(pl.plan_finish_datetime, '%Y-%m-%d %H:%i:%s') AS plan_finish_datetime,
      pl.plan_hrs,
      pl.plan_manday,
      pl.worktype_id,
      pl.master_user_id,
      pl.include_inspection,
      pl.criticality,
      
      -- Work Order Faults
      f.faults_id,
      f.impact_id,
      f.symptom_id,
      f.job_breakdown,
      f.faultdescription,
      f.location_id AS fault_location_id,
      
      -- Work Order Preparations
      prep.preparation_id,
      prep.standard_jobs,
      prep.work_des,
      prep.insp_note,
      prep.pm_no,
      prep.actions_id,
      prep.pm_desc,
      prep.cuscode_id,
      prep.systemtype_id,
      prep.events_id,
      prep.issuetype_id,
      prep.pending_id,
      prep.em_workleader_id,
      prep.em_prepare_id,
      
      -- Work Order Reports
      r.reports_id,
      r.errorclass_id,
      r.performaction_id,
      r.symptom_id AS report_symptom_id,
      r.work_done,
      DATE_FORMAT(r.real_start_datetime,  '%Y-%m-%d %H:%i:%s') AS real_start_datetime,
      DATE_FORMAT(r.real_finish_datetime, '%Y-%m-%d %H:%i:%s') AS real_finish_datetime,
      r.errortype_id,
      r.errorcause_id,
      r.work_desc,
      
      -- Work Order Breakdowns
      b.breakdown_id,
      DATE_FORMAT(b.break_start_datetime,  '%Y-%m-%d %H:%i:%s') AS break_start_datetime,
      DATE_FORMAT(b.break_finish_datetime, '%Y-%m-%d %H:%i:%s') AS break_finish_datetime,
      
      -- JOIN display names
      COALESCE(p1.pns_name, '-') AS requester_user_name,
      COALESCE(p2.pns_name, '-') AS requester_name,
      COALESCE(d.dep_name, '-') AS department_name,
      COALESCE(l.location_name, '-') AS location_name,
      COALESCE(e.equipment_name, '-') AS equipment_name,
      COALESCE(c.customer_name, '-') AS customer_name,
      COALESCE(fn.fund_name, '-') AS fund_name,
      COALESCE(tp.tp_name, '-') AS testpoint_name,
      COALESCE(pm.pns_name, '-') AS master_user_name,
      COALESCE(ml.pns_name, '-') AS main_leader_name,
      COALESCE(cw.pns_name, '-') AS child_worker_name,
      COALESCE(wg.group_name, '-') AS group_name,
      ms.jobstatus_type AS status_name
      
    FROM work_orders wo
    LEFT JOIN work_order_plannings pl ON wo.workorder_id = pl.workorder_id
    LEFT JOIN work_order_faults f ON wo.workorder_id = f.workorder_id
    LEFT JOIN work_order_preparations prep ON wo.workorder_id = prep.workorder_id
    LEFT JOIN work_order_reports r ON wo.workorder_id = r.workorder_id
    LEFT JOIN work_order_breakdowns b ON wo.workorder_id = b.workorder_id
    LEFT JOIN personnel p1 ON wo.requester_user_id = p1.pns_id
    LEFT JOIN personnel p2 ON wo.requester_id = p2.pns_id
    LEFT JOIN departments d ON wo.dep_id = d.dep_id
    LEFT JOIN locations l ON wo.location_id = l.location_id
    LEFT JOIN equipment_storages e ON wo.equipment_id = e.equipment_id
    LEFT JOIN customers c ON wo.customer_id = c.customer_id
    LEFT JOIN fund_center fn ON wo.fund_id = fn.fund_id
    LEFT JOIN test_points tp ON wo.tp_id = tp.tp_id
    LEFT JOIN personnel pm ON pl.master_user_id = pm.pns_id
    LEFT JOIN personnel ml ON wo.main_leader_user_id = ml.pns_id
    LEFT JOIN personnel cw ON wo.child_worker_user_id = cw.pns_id
    LEFT JOIN work_order_groups wg ON wo.group_id = wg.group_id
    LEFT JOIN master_statuses ms ON wo.jobstatus_id = ms.jobstatus_id
    WHERE wo.workorder_id = ?
  `,
    [id],
  );

  return rows[0] || null;
};

//=================== ดึง Activities ของ Work Order ===================
exports.getActivitiesByWorkOrderId = async (workorder_id) => {
  const [rows] = await db.query(
    `
    SELECT
      a.activity_id,
      a.activity,
      a.employee_id,
      a.craft_id,
      a.tools_id,
      DATE_FORMAT(a.datefrom_datetime, '%Y-%m-%d %H:%i:%s') AS datefrom_datetime,
      DATE_FORMAT(a.dateto_datetime,   '%Y-%m-%d %H:%i:%s') AS dateto_datetime,
      COALESCE(emp.resource_name, '-') AS employee_name,
      COALESCE(craft.resource_name, '-') AS craft_name,
      COALESCE(tools.resource_name, '-') AS tools_name
    FROM work_order_activities a
    LEFT JOIN activity_resources emp 
      ON a.employee_type = emp.resource_type AND a.employee_id = emp.resource_id
    LEFT JOIN activity_resources craft 
      ON a.craft_type = craft.resource_type AND a.craft_id = craft.resource_id
    LEFT JOIN activity_resources tools 
      ON a.tools_type = tools.resource_type AND a.tools_id = tools.resource_id
    WHERE a.workorder_id = ?
    ORDER BY a.activity_id
  `,
    [workorder_id],
  );

  return rows;
};

//=================== ดึง Master Data สำหรับ Dropdowns ===================
exports.getActivityMasters = async () => {
  const [personnel] = await db.query(
    "SELECT pns_id AS value, pns_name AS label FROM personnel ORDER BY pns_name",
  );

  const [departments] = await db.query(
    "SELECT dep_id AS value, dep_name AS label FROM departments ORDER BY dep_name",
  );

  const [locations] = await db.query(
    "SELECT location_id AS value, location_name AS label FROM locations ORDER BY location_name",
  );

  const [equipments] = await db.query(
    "SELECT equipment_id AS value, equipment_name AS label FROM equipment_storages ORDER BY equipment_name",
  );

  const [customers] = await db.query(
    "SELECT customer_id AS value, customer_name AS label FROM customers ORDER BY customer_name",
  );

  const [testPoints] = await db.query(
    "SELECT tp_id AS value, tp_name AS label FROM test_points ORDER BY tp_name",
  );

  const [funds] = await db.query(
    "SELECT fund_id AS value, fund_name AS label FROM fund_center ORDER BY fund_name",
  );

  const [workOrderGroups] = await db.query(
    "SELECT group_id AS value, group_name AS label FROM work_order_groups ORDER BY group_name",
  );

  const [jobStatuses] = await db.query(
    "SELECT jobstatus_id AS value, jobstatus_type AS label FROM master_statuses ORDER BY jobstatus_id",
  );

  const [pmList] = await db.query(
    "SELECT pm_no AS value, pm_name AS label FROM preventive_maintenance ORDER BY pm_name",
  );

  const [customerCodes] = await db.query(
    "SELECT cuscode_id AS value, cuscode_name AS label FROM costomer_code ORDER BY cuscode_name",
  );

  // Lookups
  const [workTypes] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'work_types' ORDER BY lookup_name",
  );

  const [priorities] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'priorities' ORDER BY lookup_name",
  );

  const [impacts] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'impact' ORDER BY lookup_name",
  );

  const [symptoms] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'symptom' ORDER BY lookup_name",
  );

  const [standardJobs] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'standard_job' ORDER BY lookup_name",
  );

  const [systemTypes] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'system_type' ORDER BY lookup_name",
  );

  const [events] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'event' ORDER BY lookup_name",
  );

  const [issueTypes] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'issue_type' ORDER BY lookup_name",
  );

  const [pendingReasons] = await db.query(
    "SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'pending_reason' ORDER BY lookup_name",
  );

  // Actions
  const [actions] = await db.query(
    "SELECT actions_id AS value, actions_name AS label FROM actions WHERE actions_type = 'actions' ORDER BY actions_name",
  );

  const [performActions] = await db.query(
    "SELECT actions_id AS value, actions_name AS label FROM actions WHERE actions_type = 'performaction' ORDER BY actions_name",
  );

  // Employees
  const [workLeaders] = await db.query(
    "SELECT employees_id AS value, employees_name AS label FROM employees WHERE employees_type = 'employee_work_leader' ORDER BY employees_name",
  );

  const [preparedBy] = await db.query(
    "SELECT employees_id AS value, employees_name AS label FROM employees WHERE employees_type = 'employee_prepare' ORDER BY employees_name",
  );

  // Activity Resources
  const [activityEmployees] = await db.query(
    "SELECT resource_id AS value, resource_name AS label FROM activity_resources WHERE resource_type = 'activity_employees' ORDER BY resource_name",
  );

  const [activityCrafts] = await db.query(
    "SELECT resource_id AS value, resource_name AS label FROM activity_resources WHERE resource_type = 'activity_crafts' ORDER BY resource_name",
  );

  const [activityTools] = await db.query(
    "SELECT resource_id AS value, resource_name AS label FROM activity_resources WHERE resource_type = 'activity_tools' ORDER BY resource_name",
  );

  // Error Resources
  const [errorClasses] = await db.query(
    "SELECT errors_id AS value, errors_name AS label FROM error_resources WHERE errors_type = 'classes' ORDER BY errors_name",
  );

  const [errorTypes] = await db.query(
    "SELECT errors_id AS value, errors_name AS label FROM error_resources WHERE errors_type = 'type' ORDER BY errors_name",
  );

  const [errorCauses] = await db.query(
    "SELECT errors_id AS value, errors_name AS label FROM error_resources WHERE errors_type = 'causes' ORDER BY errors_name",
  );

  return {
    personnel,
    departments,
    locations,
    equipments,
    customers,
    testPoints,
    funds,
    workOrderGroups,
    jobStatuses,
    pmList,
    customerCodes,
    workTypes,
    priorities,
    impacts,
    symptoms,
    standardJobs,
    systemTypes,
    events,
    issueTypes,
    pendingReasons,
    actions,
    performActions,
    workLeaders,
    preparedBy,
    activityEmployees,
    activityCrafts,
    activityTools,
    errorClasses,
    errorTypes,
    errorCauses,
  };
};

//=================== Update Work Order (General + Planning + Faults) ===================
exports.updateActivityWorkOrder = async (id, data, updated_by) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Helper function to convert datetime to date (YYYY-MM-DD)
    const toDateOnly = (datetime) => {
      if (!datetime) return null;
      // Extract only date part from ISO string or datetime
      if (typeof datetime === "string" && datetime.includes("T")) {
        return datetime.split("T")[0];
      }
      // If already in YYYY-MM-DD format
      return datetime;
    };

    // Helper function to convert datetime to MySQL DATETIME format
    const toDateTime = (datetime) => {
      if (!datetime) return null;
      if (typeof datetime === "string") {
        // Remove timezone: "2026-01-25T17:00:00.000Z" -> "2026-01-25 17:00:00"
        return datetime
          .replace("T", " ")
          .replace(/\.\d{3}Z$/, "")
          .replace("Z", "");
      }
      return datetime;
    };

    // 1. Update work_orders
    await conn.query(
      `
      UPDATE work_orders
      SET requester_id = ?,
          detail_report = ?,
          dep_id = ?,
          location_id = ?,
          jobstatus_id = ?,
          fund_id = ?,
          equipment_id = ?,
          customer_id = ?,
          tp_id = ?,
          post_date = ?,
          main_leader_user_id = ?,
          child_worker_user_id = ?,
          group_id = ?,
          update_datetime = NOW()
      WHERE workorder_id = ?
    `,
      [
        data.requester_id,
        data.detail_report,
        data.dep_id,
        data.location_id,
        data.jobstatus_id,
        data.fund_id,
        data.equipment_id,
        data.customer_id,
        data.tp_id,
        toDateOnly(data.post_date), // แปลงเป็น Date format (YYYY-MM-DD)
        data.main_leader_user_id,
        data.child_worker_user_id,
        data.group_id,
        id,
      ],
    );

    // 2. Update/Insert work_order_plannings
    const [planningExists] = await conn.query(
      "SELECT planning_id FROM work_order_plannings WHERE workorder_id = ?",
      [id],
    );

    if (planningExists.length > 0) {
      await conn.query(
        `
        UPDATE work_order_plannings
        SET priority_id = ?,
            req_start_datetime = ?,
            req_finish_datetime = ?,
            plan_start_datetime = ?,
            plan_finish_datetime = ?,
            plan_hrs = ?,
            plan_manday = ?,
            worktype_id = ?,
            master_user_id = ?,
            include_inspection = ?,
            criticality = ?
        WHERE workorder_id = ?
      `,
        [
          data.priority_id,
          toDateTime(data.req_start_datetime),
          toDateTime(data.req_finish_datetime),
          toDateTime(data.plan_start_datetime),
          toDateTime(data.plan_finish_datetime),
          data.plan_hrs,
          data.plan_manday,
          data.worktype_id,
          data.master_user_id,
          data.include_inspection ? 1 : 0,
          data.criticality,
          id,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO work_order_plannings
          (workorder_id, priority_id, req_start_datetime, req_finish_datetime,
           plan_start_datetime, plan_finish_datetime, plan_hrs, plan_manday,
           worktype_id, master_user_id, include_inspection, criticality)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          data.priority_id,
          toDateTime(data.req_start_datetime),
          toDateTime(data.req_finish_datetime),
          toDateTime(data.plan_start_datetime),
          toDateTime(data.plan_finish_datetime),
          data.plan_hrs,
          data.plan_manday,
          data.worktype_id,
          data.master_user_id,
          data.include_inspection ? 1 : 0,
          data.criticality,
        ],
      );
    }

    // 3. Update/Insert work_order_faults
    const [faultExists] = await conn.query(
      "SELECT faults_id FROM work_order_faults WHERE workorder_id = ?",
      [id],
    );

    if (faultExists.length > 0) {
      await conn.query(
        `
        UPDATE work_order_faults
        SET impact_id = ?,
            symptom_id = ?,
            job_breakdown = ?,
            faultdescription = ?,
            location_id = ?
        WHERE workorder_id = ?
      `,
        [
          data.impact_id,
          data.symptom_id,
          data.job_breakdown ? 1 : 0,
          data.faultdescription,
          data.fault_location_id,
          id,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO work_order_faults
          (workorder_id, impact_id, symptom_id, job_breakdown, faultdescription, location_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          data.impact_id,
          data.symptom_id,
          data.job_breakdown ? 1 : 0,
          data.faultdescription,
          data.fault_location_id,
        ],
      );
    }

    // 4. Log
    await conn.query(
      `
      INSERT INTO work_order_logs
        (workorder_id, action, changes, changed_by, changed_at)
      VALUES (?, 'update', ?, ?, NOW())
    `,
      [id.toString().padStart(7, "0"), JSON.stringify(data), updated_by],
    );

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//=================== Update Job Status Only ===================
exports.updateJobStatus = async (id, newStatusId, updated_by) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1) ตรวจสอบว่างานนี้มีอยู่จริง
    const [rows] = await conn.query(
      "SELECT workorder_id, jobstatus_id FROM work_orders WHERE workorder_id = ? FOR UPDATE",
      [id],
    );

    if (!rows.length) {
      throw new Error("ไม่พบงานนี้");
    }

    // 2) Validate — ห้ามใช้ status 99
    const excludedStatuses = [99];
    if (excludedStatuses.includes(Number(newStatusId))) {
      throw new Error(
        `ไม่สามารถเปลี่ยนสถานะเป็น ${newStatusId} ได้ กรุณาเลือกสถานะอื่น`,
      );
    }

    const oldStatusId = rows[0].jobstatus_id;

    // 3) Update jobstatus_id เท่านั้น
    await conn.query(
      `UPDATE work_orders
       SET jobstatus_id = ?,
           update_datetime = NOW()
       WHERE workorder_id = ?`,
      [newStatusId, id],
    );

    // 4) Log การเปลี่ยนแปลง
    await conn.query(
      `INSERT INTO work_order_logs
         (workorder_id, action, changes, changed_by, changed_at)
       VALUES (?, 'change_status', ?, ?, NOW())`,
      [
        id.toString().padStart(7, "0"),
        JSON.stringify({ old_status: oldStatusId, new_status: newStatusId }),
        updated_by,
      ],
    );

    await conn.commit();

    console.log(`✅ เปลี่ยน status งาน ${id}: ${oldStatusId} → ${newStatusId}`);

    return {
      workorder_id: id,
      old_status: oldStatusId,
      new_status: newStatusId,
    };
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error in updateJobStatus:", err.message);
    throw err;
  } finally {
    conn.release();
  }
};

//=================== Update Preparations ===================
exports.updatePreparations = async (workorder_id, data, updated_by) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [prepExists] = await conn.query(
      "SELECT preparation_id FROM work_order_preparations WHERE workorder_id = ?",
      [workorder_id],
    );

    if (prepExists.length > 0) {
      await conn.query(
        `
        UPDATE work_order_preparations
        SET standard_jobs = ?,
            work_des = ?,
            insp_note = ?,
            pm_no = ?,
            actions_id = ?,
            pm_desc = ?,
            cuscode_id = ?,
            systemtype_id = ?,
            events_id = ?,
            issuetype_id = ?,
            pending_id = ?,
            em_workleader_id = ?,
            em_prepare_id = ?
        WHERE workorder_id = ?
      `,
        [
          data.standard_jobs,
          data.work_des,
          data.insp_note,
          data.pm_no,
          data.actions_id,
          data.pm_desc,
          data.cuscode_id,
          data.systemtype_id,
          data.events_id,
          data.issuetype_id,
          data.pending_id,
          data.em_workleader_id,
          data.em_prepare_id,
          workorder_id,
        ],
      );
    } else {
      await conn.query(
        `
        INSERT INTO work_order_preparations
          (workorder_id, standard_jobs, work_des, insp_note, pm_no, actions_id,
           pm_desc, cuscode_id, systemtype_id, events_id, issuetype_id,
           pending_id, em_workleader_id, em_prepare_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          workorder_id,
          data.standard_jobs,
          data.work_des,
          data.insp_note,
          data.pm_no,
          data.actions_id,
          data.pm_desc,
          data.cuscode_id,
          data.systemtype_id,
          data.events_id,
          data.issuetype_id,
          data.pending_id,
          data.em_workleader_id,
          data.em_prepare_id,
        ],
      );
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

//=================== Add Activity ===================
exports.addActivity = async (workorder_id, data, updated_by) => {
  // แปลง datetime format เหมือน updateActivityWorkOrder
  const toDateTime = (val) => {
    if (!val || val.trim() === "") return null;
    return val
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "")
      .replace("Z", "");
  };

  const [result] = await db.query(
    `
    INSERT INTO work_order_activities
      (workorder_id, activity, employee_id, craft_id, tools_id, datefrom_datetime, dateto_datetime)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      workorder_id,
      data.activity || null,
      data.employee_id || null,
      data.craft_id || null,
      data.tools_id || null,
      toDateTime(data.datefrom_datetime),
      toDateTime(data.dateto_datetime),
    ],
  );

  return { activity_id: result.insertId };
};

//=================== Delete Activity ===================
exports.deleteActivity = async (activity_id) => {
  await db.query("DELETE FROM work_order_activities WHERE activity_id = ?", [
    activity_id,
  ]);
  return { success: true };
};

//=================== Update Report ===================
exports.updateReport = async (workorder_id, data, updated_by) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // แปลง empty string → null สำหรับ datetime fields
    const toDateTimeOrNull = (val) => {
      if (!val || val.trim() === "") return null;
      return val
        .replace("T", " ")
        .replace(/\.\d{3}Z$/, "")
        .replace("Z", "");
    };

    const real_start = toDateTimeOrNull(data.real_start_datetime);
    const real_finish = toDateTimeOrNull(data.real_finish_datetime);

    // ✅ FIX 1: NOT NULL fields ใน DB ต้องไม่ส่ง null — ใช้ empty string แทน
    const work_desc     = data.work_desc     || "";
    const errortype_id  = data.errortype_id  || "";
    const errorcause_id = data.errorcause_id || "";

    // ✅ FIX 2: symptom ใช้ composite FK (symptom_type + symptom_id)
    // ต้อง set symptom_type ด้วยเสมอ ไม่งั้น FK constraint fail
    const symptom_id   = data.symptom_id || null;
    const symptom_type = symptom_id ? "symptom" : null;

    const [reportExists] = await conn.query(
      "SELECT reports_id FROM work_order_reports WHERE workorder_id = ?",
      [workorder_id],
    );

    if (reportExists.length > 0) {
      // ✅ FIX 3: real_start/finish เป็น NOT NULL ใน DB
      // ถ้ายังไม่กรอกวันที่ → อัปเดตเฉพาะ fields อื่น ไม่แตะ datetime columns
      if (real_start && real_finish) {
        await conn.query(
          `
          UPDATE work_order_reports
          SET errorclass_id = ?,
              performaction_id = ?,
              symptom_type = ?,
              symptom_id = ?,
              work_done = ?,
              real_start_datetime = ?,
              real_finish_datetime = ?,
              errortype_id = ?,
              errorcause_id = ?,
              work_desc = ?
          WHERE workorder_id = ?
        `,
          [
            data.errorclass_id || null,
            data.performaction_id || null,
            symptom_type,
            symptom_id,
            data.work_done || null,
            real_start,
            real_finish,
            errortype_id,
            errorcause_id,
            work_desc,
            workorder_id,
          ],
        );
      } else {
        // ยังไม่มีวันที่ → อัปเดตเฉพาะ fields ที่ไม่ใช่ NOT NULL datetime
        await conn.query(
          `
          UPDATE work_order_reports
          SET errorclass_id = ?,
              performaction_id = ?,
              symptom_type = ?,
              symptom_id = ?,
              work_done = ?,
              errortype_id = ?,
              errorcause_id = ?,
              work_desc = ?
          WHERE workorder_id = ?
        `,
          [
            data.errorclass_id || null,
            data.performaction_id || null,
            symptom_type,
            symptom_id,
            data.work_done || null,
            errortype_id,
            errorcause_id,
            work_desc,
            workorder_id,
          ],
        );
      }
    } else {
      // ✅ INSERT: real_start/finish เป็น NOT NULL → ต้องมีวันที่ครบก่อนถึง INSERT ได้
      if (real_start && real_finish) {
        await conn.query(
          `
          INSERT INTO work_order_reports
            (workorder_id, errorclass_id, performaction_id, symptom_type, symptom_id, work_done,
             real_start_datetime, real_finish_datetime, errortype_id, errorcause_id, work_desc)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            workorder_id,
            data.errorclass_id || null,
            data.performaction_id || null,
            symptom_type,
            symptom_id,
            data.work_done || null,
            real_start,
            real_finish,
            errortype_id,
            errorcause_id,
            work_desc,
          ],
        );
      }
      // ถ้าไม่มีวันที่และยังไม่มี row → ยังไม่ทำอะไร (user ยังไม่ได้กรอกวันที่)
    }

    // Update/Insert breakdown
    if (data.break_start_datetime || data.break_finish_datetime) {
      const break_start = toDateTimeOrNull(data.break_start_datetime);
      const break_finish = toDateTimeOrNull(data.break_finish_datetime);

      const [breakdownExists] = await conn.query(
        "SELECT breakdown_id FROM work_order_breakdowns WHERE workorder_id = ?",
        [workorder_id],
      );

      if (breakdownExists.length > 0) {
        await conn.query(
          `
          UPDATE work_order_breakdowns
          SET break_start_datetime = ?,
              break_finish_datetime = ?
          WHERE workorder_id = ?
        `,
          [break_start, break_finish, workorder_id],
        );
      } else {
        await conn.query(
          `
          INSERT INTO work_order_breakdowns
            (workorder_id, break_start_datetime, break_finish_datetime)
          VALUES (?, ?, ?)
        `,
          [workorder_id, break_start, break_finish],
        );
      }
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};