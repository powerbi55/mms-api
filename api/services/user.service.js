const db = require('../config/db');
const bcrypt = require('bcrypt');

//================สร้าง Admin 1 เท่านั้น ======================================
//=========================================================================
exports.register = async ({ pns_id, user_password, user_role }) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    
    const [personnel] = await conn.query(                             //ตรวจว่ามี pns_id นี้อยู่ในตาราง personnel หรือไม่
      `SELECT pns_id, dep_id 
       FROM personnel 
       WHERE pns_id = ?`,
      [pns_id]
    );

    if (personnel.length === 0) {
      throw new Error('ไม่พบข้อมูลบุคลากร');
    }

    const dep_id = personnel[0].dep_id;

                                                      
    const [departments] = await conn.query(                            //ตรวจว่ามี dep_id นี้อยู่ในตาราง departments หรือไม่
      `SELECT dep_id FROM departments WHERE dep_id = ?`,
      [dep_id]
    );

    if (departments.length === 0) {
      throw new Error('ไม่พบข้อมูลแผนก');
    }

    
    const [existUser] = await conn.query(                               //ตรวจว่ามี user_id ซ้ำหรือไม่
      `SELECT user_id FROM users WHERE user_id = ?`,
      [pns_id]
    );

    if (existUser.length > 0) {
      throw new Error('บุคลากรนี้ถูกสมัครแล้ว');
    }

    
    const hashPassword = await bcrypt.hash(user_password, 10);          //เข้ารหัสรหัสผ่าน (hash password)

    
    await conn.query(                                                   //เพิ่มข้อมูลลงตาราง users
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
//=========================================================================
//=========================================================================

//==================ค้นหาผู้ใช้ 1 คน จากตาราง users โดยใช้ pns_id===============
//=========================================================================
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
//=========================================================================
//=========================================================================

//=============ค้นหาผู้ใช้ 1 คน จากตาราง PERSONNEL โดยใช้ pns_id===============
//=========================================================================  
exports.findPersonnelByPnsId = async (pns_id) => {
  console.log('🔎 QUERY personnel pns_id =', pns_id);
  console.log('🔐 LOGIN');
  console.log('input pns_id:', pns_id);
  console.log('input password:', user_password);
  console.log('db hash:', user.user_password);

  const [rows] = await db.query(
    `SELECT pns_id, pns_name, dep_id
     FROM personnel
     WHERE pns_id = ?`,
    [pns_id]
  );

  console.log('📄 personnel rows:', rows);
  return rows[0];
};
//=========================================================================
//=========================================================================

//==================อัพเดทข้อมูล user========================================
//=========================================================================
exports.update = async (pns_id, data) => {
  const fields = [];
  const values = [];

  // 🔐 UPDATE PASSWORD
  if (data.user_password) {
    console.log('🔴 UPDATE PASSWORD');
    console.log('incoming password:', data.user_password);

    // ❌ ป้องกัน hash ซ้ำ
    if (data.user_password.startsWith('$2b$')) {
      throw new Error('Invalid password format');
    }

    const hash = await bcrypt.hash(data.user_password, 10);
    console.log('new hashed password:', hash);

    fields.push('user_password = ?');
    values.push(hash);
  }

  // 👮 UPDATE ROLE
  if (data.user_role) {
    const allowed = ['ADMIN', 'ChiefTechnician', 'Technician'];
    if (!allowed.includes(data.user_role)) {
      throw new Error('Invalid user role');
    }

    fields.push('user_role = ?');
    values.push(data.user_role);
  }

  // 🏢 UPDATE DEPARTMENT
  if (data.dep_id) {
    fields.push('dep_id = ?');
    values.push(data.dep_id);
  }

  if (fields.length === 0) {
    throw new Error('No data to update');
  }

  fields.push('user_last_update = NOW()');

  // ✅ ใช้ pns_id ให้ตรงกับ login
  values.push(pns_id);

  const [result] = await db.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE pns_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new Error('Update failed: user not found');
  }

  return true;
};
//========================================================================= 
//=========================================================================

//==================สร้างuserโดยใช้ beware admin===============================
//=========================================================================
exports.createByAdmin = async ({ pns_id, user_password, user_role }) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 0️⃣ validate
    if (!pns_id || !user_password || !user_role) {
      throw new Error('ข้อมูลไม่ครบ');
    }


    // 1️⃣ ตรวจ personnel
    const [personnel] = await conn.query(
      `SELECT dep_id 
       FROM personnel 
       WHERE pns_id = ?`,
      [pns_id]
    );

    if (personnel.length === 0) {
      throw new Error('Personnel not found');
    }

    const dep_id = personnel[0].dep_id;

    // 2️⃣ ตรวจ user ซ้ำ (ต้องเช็กจาก pns_id)
    const [exist] = await conn.query(
      `SELECT user_id 
       FROM users 
       WHERE pns_id = ?`,
      [pns_id]
    );

    if (exist.length > 0) {
      throw new Error('User already exists');
    }

    // 3️⃣ hash password
    const hashPassword = await bcrypt.hash(user_password, 10);

    // 4️⃣ insert users
    await conn.query(
      `INSERT INTO users
       (user_id, pns_id, user_password, user_role, dep_id, user_last_update)
       VALUES (?, ?, ?, ?, ?, NOW())`,
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
//=========================================================================
//=========================================================================