// Historicalworkorders.service.js
// Read-only service — ดึงเฉพาะ Work Orders ที่ jobstatus_id = 1 (Completed)
const db = require('../config/db');

//=================== ดึง Historical Work Order List (Completed เท่านั้น) ===================
exports.getHistoricalWorkOrderList = async (filters = {}) => {
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
      AND wo.jobstatus_id = 1
  `;

  const params = [];

  if (filters.workOrder) {
    query += ` AND wo.workorder_id LIKE ?`;
    params.push(`%${filters.workOrder}%`);
  }

  if (filters.equipment) {
    query += ` AND e.equipment_id = ?`;
    params.push(filters.equipment);
  }

  if (filters.siteId) {
    query += ` AND l.location_id LIKE ?`;
    params.push(`%${filters.siteId}%`);
  }

  if (filters.department) {
    query += ` AND wo.dep_id = ?`;
    params.push(filters.department);
  }

  query += ` ORDER BY wo.update_datetime DESC`;

  const [rows] = await db.query(query, params);
  return rows;
};

//=================== ดึงรายละเอียด Historical Work Order แบบเต็ม ===================
exports.getHistoricalWorkOrderById = async (id) => {
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
      AND wo.jobstatus_id = 1
    `,
    [id]
  );

  return rows[0] || null;
};

//=================== ดึง Activities ของ Historical Work Order ===================
exports.getHistoricalActivitiesByWorkOrderId = async (workorder_id) => {
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
    [workorder_id]
  );

  return rows;
};

//=================== ดึง Master Data สำหรับ Dropdowns (เหมือน Activity แต่แยกไฟล์ไว้) ===================
exports.getHistoricalMasters = async () => {
  const [personnel] = await db.query('SELECT pns_id AS value, pns_name AS label FROM personnel ORDER BY pns_name');
  const [departments] = await db.query('SELECT dep_id AS value, dep_name AS label FROM departments ORDER BY dep_name');
  const [locations] = await db.query('SELECT location_id AS value, location_name AS label FROM locations ORDER BY location_name');
  const [equipments] = await db.query('SELECT equipment_id AS value, equipment_name AS label FROM equipment_storages ORDER BY equipment_name');
  const [customers] = await db.query('SELECT customer_id AS value, customer_name AS label FROM customers ORDER BY customer_name');
  const [testPoints] = await db.query('SELECT tp_id AS value, tp_name AS label FROM test_points ORDER BY tp_name');
  const [funds] = await db.query('SELECT fund_id AS value, fund_name AS label FROM fund_center ORDER BY fund_name');
  const [workOrderGroups] = await db.query('SELECT group_id AS value, group_name AS label FROM work_order_groups ORDER BY group_name');
  const [jobStatuses] = await db.query('SELECT jobstatus_id AS value, jobstatus_type AS label FROM master_statuses ORDER BY jobstatus_id');
  const [pmList] = await db.query('SELECT pm_no AS value, pm_name AS label FROM preventive_maintenance ORDER BY pm_name');
  const [customerCodes] = await db.query('SELECT cuscode_id AS value, cuscode_name AS label FROM costomer_code ORDER BY cuscode_name');
  const [workTypes] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'work_types' ORDER BY lookup_name");
  const [priorities] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'priorities' ORDER BY lookup_name");
  const [impacts] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'impact' ORDER BY lookup_name");
  const [symptoms] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'symptom' ORDER BY lookup_name");
  const [standardJobs] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'standard_job' ORDER BY lookup_name");
  const [systemTypes] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'system_type' ORDER BY lookup_name");
  const [events] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'event' ORDER BY lookup_name");
  const [issueTypes] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'issue_type' ORDER BY lookup_name");
  const [pendingReasons] = await db.query("SELECT lookup_id AS value, lookup_name AS label FROM lookups WHERE lookup_type = 'pending_reason' ORDER BY lookup_name");
  const [actions] = await db.query("SELECT actions_id AS value, actions_name AS label FROM actions WHERE actions_type = 'actions' ORDER BY actions_name");
  const [performActions] = await db.query("SELECT actions_id AS value, actions_name AS label FROM actions WHERE actions_type = 'performaction' ORDER BY actions_name");
  const [workLeaders] = await db.query("SELECT employees_id AS value, employees_name AS label FROM employees WHERE employees_type = 'employee_work_leader' ORDER BY employees_name");
  const [preparedBy] = await db.query("SELECT employees_id AS value, employees_name AS label FROM employees WHERE employees_type = 'employee_prepare' ORDER BY employees_name");
  const [activityEmployees] = await db.query("SELECT resource_id AS value, resource_name AS label FROM activity_resources WHERE resource_type = 'activity_employees' ORDER BY resource_name");
  const [activityCrafts] = await db.query("SELECT resource_id AS value, resource_name AS label FROM activity_resources WHERE resource_type = 'activity_crafts' ORDER BY resource_name");
  const [activityTools] = await db.query("SELECT resource_id AS value, resource_name AS label FROM activity_resources WHERE resource_type = 'activity_tools' ORDER BY resource_name");
  const [errorClasses] = await db.query("SELECT errors_id AS value, errors_name AS label FROM error_resources WHERE errors_type = 'classes' ORDER BY errors_name");
  const [errorTypes] = await db.query("SELECT errors_id AS value, errors_name AS label FROM error_resources WHERE errors_type = 'type' ORDER BY errors_name");
  const [errorCauses] = await db.query("SELECT errors_id AS value, errors_name AS label FROM error_resources WHERE errors_type = 'causes' ORDER BY errors_name");

  return {
    personnel, departments, locations, equipments, customers,
    testPoints, funds, workOrderGroups, jobStatuses, pmList,
    customerCodes, workTypes, priorities, impacts, symptoms,
    standardJobs, systemTypes, events, issueTypes, pendingReasons,
    actions, performActions, workLeaders, preparedBy,
    activityEmployees, activityCrafts, activityTools,
    errorClasses, errorTypes, errorCauses,
  };
};