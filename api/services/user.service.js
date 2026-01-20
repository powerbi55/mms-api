const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * REGISTER
 */
exports.register = async ({ pns_id, user_password, user_role }) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ ตรวจ personnel และดึง dep_id
    const [personnel] = await conn.query(
      `SELECT pns_id, dep_id 
       FROM personnel 
       WHERE pns_id = ?`,
      [pns_id]
    );

    if (personnel.length === 0) {
      throw new Error('ไม่พบข้อมูลบุคลากร');
    }

    const dep_id = personnel[0].dep_id;

    // 2️⃣ ตรวจ department
    const [departments] = await conn.query(
      `SELECT dep_id FROM departments WHERE dep_id = ?`,
      [dep_id]
    );

    if (departments.length === 0) {
      throw new Error('ไม่พบข้อมูลแผนก');
    }

    // 3️⃣ ตรวจว่ามี user แล้วหรือยัง
    const [existUser] = await conn.query(
      `SELECT user_id FROM users WHERE user_id = ?`,
      [pns_id]
    );

    if (existUser.length > 0) {
      throw new Error('บุคลากรนี้ถูกสมัครแล้ว');
    }

    // 4️⃣ hash password
    const hashPassword = await bcrypt.hash(user_password, 10);

    // 5️⃣ insert users
    await conn.query(
      `INSERT INTO users 
       (user_id, pns_id, user_password, user_last_update, user_role, dep_id)
       VALUES (?, ?, ?, NOW(), ?, ?)`,
      [
        pns_id,          // user_id
        pns_id,          // pns_id
        hashPassword,
        user_role,
        dep_id
      ]
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

/**
 * LOGIN
 * - ใช้ pns_id
 * - ดึงข้อมูล user สำหรับตรวจ password และสร้าง JWT
 */
exports.findByPnsId = async (pns_id) => {
  const [rows] = await db.query(
    `SELECT 
        user_id,
        pns_id,
        user_password,
        user_role,
        dep_id
     FROM users
     WHERE pns_id = ?`,
    [pns_id]
  );

  return rows[0];
};
