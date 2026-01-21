const db = require('../config/db');
const bcrypt = require('bcrypt');

/* ================================== */
exports.register = async ({ pns_id, user_password, user_role }) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ ตรวจ personnel
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

    // 3️⃣ ตรวจ user ซ้ำ
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
        pns_id,
        pns_id,
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

/* ================================== */
exports.findUserByPnsId  = async (pns_id) => {
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

/* ================================== */
exports.findPersonnelByPnsId = async (pns_id) => {
  console.log('🔎 QUERY personnel pns_id =', pns_id);

  const [rows] = await db.query(
    `SELECT pns_id, pns_name, dep_id
     FROM personnel
     WHERE pns_id = ?`,
    [pns_id]
  );

  console.log('📄 personnel rows:', rows);
  return rows[0];
};

/* ================================== */
exports.update = async (user_id, data) => {
  const fields = [];
  const values = [];

  if (data.user_password) {
    const hash = await bcrypt.hash(data.user_password, 10);
    fields.push('user_password = ?');
    values.push(hash);
  }

  if (data.user_role) {
    const allowed = ['ADMIN', 'ChiefTechnician', 'Technician'];
    if (!allowed.includes(data.user_role)) {
      throw new Error('Invalid user role');
    }
    fields.push('user_role = ?');
    values.push(data.user_role);
  }

  if (data.dep_id) {
    fields.push('dep_id = ?');
    values.push(data.dep_id);
  }

  if (fields.length === 0) {
    throw new Error('No data to update');
  }

  fields.push('user_last_update = NOW()');

  values.push(user_id);

  await db.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`,
    values
  );
};

/* =================================== */
exports.createByAdmin = async ({ pns_id, user_password, user_role }) => {
  // ตรวจ personnel
  const [personnel] = await db.query(
    `SELECT dep_id FROM personnel WHERE pns_id = ?`,
    [pns_id]
  );

  if (personnel.length === 0) {
    throw new Error('Personnel not found');
  }

  // ตรวจ user ซ้ำ
  const [exist] = await db.query(
    `SELECT user_id FROM users WHERE user_id = ?`,
    [pns_id]
  );

  if (exist.length > 0) {
    throw new Error('User already exists');
  }

  const hash = await bcrypt.hash(user_password, 10);

  await db.query(
    `INSERT INTO users
     (user_id, pns_id, user_password, user_role, dep_id, user_last_update)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      pns_id,
      pns_id,
      hash,
      user_role,
      personnel[0].dep_id
    ]
  );
};
