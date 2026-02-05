const db = require('../config/db');
const bcrypt = require('bcrypt');

/* =========================================================================
   LOG HELPER (ตรงกับ table user_logs)
============================================================================ */
const insertUserLog = async (conn, {
  action,
  target_pns_id,
  changed_by,
  detail = null,
}) => {
  await conn.execute(
    `INSERT INTO user_logs
     (action, target_pns_id, changed_by, detail, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [
      action,
      target_pns_id,
      changed_by,
      detail, // ❗ JSON column → ส่ง object ได้ตรง ๆ
    ]
  );
};

/* =========================================================================
   AUTH DOMAIN (ใช้กับ login เท่านั้น)
============================================================================ */
exports.findUserForAuthByPnsId = async (pns_id) => {
  const [rows] = await db.query(
    `SELECT user_id, pns_id, user_password, user_role, dep_id
     FROM users
     WHERE pns_id = ?`,
    [pns_id]
  );
  return rows[0];
};

/* =========================================================================
   PROFILE DOMAIN
============================================================================ */
exports.getUserProfileByPnsId = async (pns_id) => {
  const [rows] = await db.query(
    `SELECT u.pns_id, p.pns_name, u.user_role, u.dep_id
     FROM users u
     JOIN personnel p ON u.pns_id = p.pns_id
     WHERE u.pns_id = ?`,
    [pns_id]
  );
  return rows[0];
};

/* =========================================================================
   PERSONNEL DOMAIN
============================================================================ */
exports.findPersonnelByPnsId = async (pns_id) => {
  const [rows] = await db.query(
    `SELECT pns_id, pns_name, dep_id
     FROM personnel
     WHERE pns_id = ?`,
    [pns_id]
  );
  return rows[0];
};

/* =========================================================================
   CHANGE PASSWORD (USER เปลี่ยนของตัวเอง)
============================================================================ */
exports.changeMyPasswordWithLog = async ({
  target_pns_id,
  new_password,
  changed_by,
}) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const hashed = await bcrypt.hash(new_password, 10);

    // 1) update password
    const [result] = await conn.execute(
      `UPDATE users
       SET user_password = ?, user_last_update = NOW()
       WHERE pns_id = ?`,
      [hashed, target_pns_id]
    );

    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }

    // 2) log (ใช้ action เดียวกับระบบเดิม)
    await insertUserLog(conn, {
      action: 'UPDATE_USER',
      target_pns_id,
      changed_by,
      detail: {
        user_password: 'CHANGED',
      },
    });

    await conn.commit();
    return true;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/* =========================================================================
   ADMIN UPDATE USER
============================================================================ */
exports.updateUserByAdminWithLog = async ({
  target_pns_id,
  updateData,
  changed_by,
}) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const fields = [];
    const values = [];
    const detail = {};

    // PASSWORD
    if (updateData.user_password) {
      const hashed = await bcrypt.hash(updateData.user_password, 10);
      fields.push('user_password = ?');
      values.push(hashed);
      detail.user_password = 'CHANGED';
    }

    // ROLE
    if (updateData.user_role) {
      fields.push('user_role = ?');
      values.push(updateData.user_role);
      detail.user_role = updateData.user_role;
    }

    // DEPARTMENT
    if (updateData.dep_id) {
      fields.push('dep_id = ?');
      values.push(updateData.dep_id);
      detail.dep_id = updateData.dep_id;
    }

    if (fields.length === 0) {
      throw new Error('No data to update');
    }

    fields.push('user_last_update = NOW()');
    values.push(target_pns_id);

    // 1) update users
    const [result] = await conn.execute(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE pns_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error('User not found');
    }

    // 2) log
    await insertUserLog(conn, {
      action: 'UPDATE_USER',
      target_pns_id,
      changed_by,
      detail,
    });

    await conn.commit();
    return true;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};