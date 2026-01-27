// น้า preworkOrders คือหน้าหลังจากตาราง preworkOrders ที่เเสดงรายการเเจ้งที่ยังไม่มีการกดรับงาน
// หน้านี้มีหน้าที่สำหรับเเก้ไขข้อมูลก่อนเเปิดงาน เมื่อกดบันทึกจะมีการสร้างรหัสงาน (job_reference) เเละอัพเดทสถานะงาน
const db = require('../config/db');

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
     WHERE workorder_id = ?`,                                                               //ดึงข้อมูลตาม id
    [id]
  );
  return rows[0];
};
//===========================================================================
//===========================================================================


//==================ดึงข้อมูล dropdownโดยการอ้างอิงจากตารางต่างๆ===================
//===========================================================================
exports.getPersonnel = async () =>
  db.query('SELECT pns_id, pns_name FROM personnel ORDER BY pns_name');                     //ใช้ในการดึงข้อมูลบุคลากรโดยอิงตาม pns_id

exports.getDepartments = async () =>
  db.query('SELECT dep_id, dep_name FROM departments ORDER BY dep_name');                   //ใช้ในการดึงข้อมูลบุคลากรโดยอิงตาม pns_id

exports.getLocations = async () =>
  db.query('SELECT location_id, location_name FROM locations ORDER BY location_name');      //ใช้ในการดึงข้อมูลสถานที่โดยอิงตาม location_id

exports.getJobStatuses = async () =>
  db.query('SELECT jobstatus_id, status_name FROM master_statuses');                        //ใช้ในการดึงข้อมูลสถานะงานโดยอิงตาม jobstatus_id
//===========================================================================
//===========================================================================


//==================อัพเดท work order========================================
//===========================================================================
exports.updateWorkOrder = async (id, data) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();


    const [old] = await conn.query(
      'SELECT job_reference FROM work_orders WHERE workorder_id = ?',                         //ใช้ workorder_id ไปหา record เดิม
      [id]
    );

    if (!old.length) throw new Error('Work order not found');                                //ถ้าไม่พบ workorder_id ที่ record เดิมให้เเจ้งว่าไม่พบ work order

    let job_reference = old[0].job_reference;                                                //ถ้ามีอยู่แล้วจะใช้ของเดิม   ถ้ายังไม่มีจะไปสร้างใหม่ในขั้นตอนถัดไป
  
    // 🔥 สร้าง job_reference เฉพาะตอนยังไม่มี
    if (!job_reference) {                                                                     //กันไม่ให้เลข job เปลี่ยนทุกครั้งที่แก้ไข
      const buddhistYear = (new Date().getFullYear() + 543)                                   //สร้างปี พ.ศ. 2 หลัก
        .toString()
        .slice(-2);

      const [run] = await conn.query(                                                         //หา running number ล่าสุดของแผนก
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

      job_reference = `${data.dep_id}-${buddhistYear}-${run[0].running}`;                      //ฟอร์แมตรหัส job_reference ใหม่
    }

    await conn.query(                                                                          //UPDATE ข้อมูล work order
      `
      UPDATE work_orders
      SET requester_id = ?,
          detail_report     = ?,
          dep_id            = ?,
          location_id       = ?,
          jobstatus_id      = ?,
          job_reference     = ?,
          update_datetime   = NOW()
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

    await conn.commit();                                                                        //commit และส่งค่า job_reference กลับ
    return job_reference;

  } catch (err) {
    await conn.rollback();                                                                      //กันข้อมูลค้าง/ข้อมูลไม่ครบ
    throw err;
  } finally {
    conn.release();
  }
};

//===========================================================================
//===========================================================================